import { Response } from 'express';
import { DatabaseService } from '../database/DatabaseService';
import { mt5Service } from './MT5Service';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';

export interface Alert {
  id: string;
  userId: string;
  type: 'risk_warning' | 'drawdown_violation' | 'volatility_spike' | 'leverage_warning';
  symbol?: string;
  message: string;
  value: number;
  threshold: number;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface AlertSubscription {
  userId: string;
  response: Response;
  lastHeartbeat: Date;
}

export class AlertService {
  private static instance: AlertService;
  private subscriptions: Map<string, AlertSubscription> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private alertCounts: Map<string, number> = new Map(); // Track alerts per user per hour

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    logger.info('Starting real-time alert monitoring...');

    // Start monitoring interval (every 10 seconds as per PRD)
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, 10000);

    // Heartbeat interval to clean up dead connections
    setInterval(() => {
      this.cleanupDeadConnections();
    }, 30000);

    // Reset alert counts every hour
    setInterval(() => {
      this.alertCounts.clear();
    }, 3600000);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Stopped real-time alert monitoring');
  }

  subscribe(userId: string, response: Response): void {
    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    this.sendSSEMessage(response, {
      type: 'connected',
      data: { userId, timestamp: new Date().toISOString() }
    });

    // Store subscription
    this.subscriptions.set(userId, {
      userId,
      response,
      lastHeartbeat: new Date()
    });

    logger.info(`User ${userId} subscribed to real-time alerts`);

    // Handle client disconnect
    response.on('close', () => {
      this.unsubscribe(userId);
    });

    // Send periodic heartbeat
    const heartbeatInterval = setInterval(() => {
      if (this.subscriptions.has(userId)) {
        this.sendHeartbeat(userId);
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);
  }

  unsubscribe(userId: string): void {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      try {
        subscription.response.end();
      } catch (error) {
        // Connection already closed
      }
      this.subscriptions.delete(userId);
      logger.info(`User ${userId} unsubscribed from real-time alerts`);
    }
  }

  private async performMonitoringCycle(): Promise<void> {
    try {
      // Get all active users with subscriptions
      const activeUsers = Array.from(this.subscriptions.keys());
      
      if (activeUsers.length === 0) return;

      // Check MT5 service health
      const mt5Healthy = await mt5Service.healthCheck();
      if (!mt5Healthy) {
        logger.warn('MT5 service unhealthy, skipping monitoring cycle');
        return;
      }

      // Monitor each user
      for (const userId of activeUsers) {
        await this.monitorUserAlerts(userId);
      }

    } catch (error) {
      logger.error('Error in monitoring cycle:', error);
    }
  }

  private async monitorUserAlerts(userId: string): Promise<void> {
    try {
      // Get user's risk profile
      const riskProfile = await DatabaseService.get<{
        max_leverage: number;
        max_drawdown: number;
        risk_tolerance: string;
      }>(
        'SELECT max_leverage, max_drawdown, risk_tolerance FROM user_risk_profiles WHERE user_id = ?',
        [userId]
      );

      if (!riskProfile) return;

      // Get user's recent trades
      const recentTrades = await DatabaseService.all(
        'SELECT * FROM trades WHERE user_id = ? ORDER BY mt5_time DESC LIMIT 50',
        [userId]
      );

      if (recentTrades.length === 0) return;

      // Check for alerts
      const alerts: Alert[] = [];

      // 1. Check drawdown violations
      const drawdownAlert = await this.checkDrawdownViolation(userId, recentTrades, riskProfile.max_drawdown);
      if (drawdownAlert) alerts.push(drawdownAlert);

      // 2. Check leverage warnings
      const leverageAlert = await this.checkLeverageWarning(userId, recentTrades, riskProfile.max_leverage);
      if (leverageAlert) alerts.push(leverageAlert);

      // 3. Check volatility spikes
      const volatilityAlerts = await this.checkVolatilitySpikes(userId, recentTrades);
      alerts.push(...volatilityAlerts);

      // 4. Check risk warnings
      const riskAlert = await this.checkRiskWarning(userId, recentTrades, riskProfile);
      if (riskAlert) alerts.push(riskAlert);

      // Send alerts (max 5 per user per hour)
      for (const alert of alerts.slice(0, 5)) {
        await this.sendAlert(alert);
      }

    } catch (error) {
      logger.error(`Error monitoring alerts for user ${userId}:`, error);
    }
  }

  private async checkDrawdownViolation(
    userId: string, 
    trades: any[], 
    maxDrawdown: number
  ): Promise<Alert | null> {
    const currentDrawdown = this.calculateCurrentDrawdown(trades);
    
    if (currentDrawdown > maxDrawdown) {
      return {
        id: uuidv4(),
        userId,
        type: 'drawdown_violation',
        message: `Drawdown violation: ${currentDrawdown.toFixed(1)}% exceeds limit of ${maxDrawdown}%`,
        value: currentDrawdown,
        threshold: maxDrawdown,
        priority: 'high',
        timestamp: new Date()
      };
    }

    return null;
  }

  private async checkLeverageWarning(
    userId: string, 
    trades: any[], 
    maxLeverage: number
  ): Promise<Alert | null> {
    // Calculate average leverage from recent trades
    const avgVolume = trades.reduce((sum, t) => sum + t.volume, 0) / trades.length;
    const estimatedLeverage = avgVolume * 100; // Rough leverage estimation

    if (estimatedLeverage > maxLeverage) {
      return {
        id: uuidv4(),
        userId,
        type: 'leverage_warning',
        message: `High leverage detected: ~${estimatedLeverage.toFixed(0)}x exceeds limit of ${maxLeverage}x`,
        value: estimatedLeverage,
        threshold: maxLeverage,
        priority: 'medium',
        timestamp: new Date()
      };
    }

    return null;
  }

  private async checkVolatilitySpikes(userId: string, trades: any[]): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const symbolGroups = this.groupTradesBySymbol(trades);

    for (const [symbol] of Object.entries(symbolGroups)) {
      try {
        // Get recent market data for the symbol
        const symbolInfo = await mt5Service.getSymbolInfo(symbol);
        
        if (symbolInfo.symbol_info) {
          const spread = symbolInfo.symbol_info.spread;
          const volatilityThreshold = 0.02; // 2% price movement in 1 hour
          
          // Simple volatility check based on spread
          if (spread > volatilityThreshold) {
            alerts.push({
              id: uuidv4(),
              userId,
              type: 'volatility_spike',
              symbol,
              message: `High volatility spike detected for ${symbol}: ${(spread * 100).toFixed(2)}% spread`,
              value: spread,
              threshold: volatilityThreshold,
              priority: 'medium',
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        // Symbol data not available, skip
      }
    }

    return alerts;
  }

  private async checkRiskWarning(
    userId: string, 
    trades: any[], 
    _riskProfile: any
  ): Promise<Alert | null> {
    const winRate = (trades.filter(t => t.profit > 0).length / trades.length) * 100;
    const totalExposure = trades.reduce((sum, t) => sum + Math.abs(t.volume), 0);

    // Risk warning if win rate is very low and exposure is high
    if (winRate < 30 && totalExposure > 5.0) {
      return {
        id: uuidv4(),
        userId,
        type: 'risk_warning',
        message: `High risk detected: ${winRate.toFixed(1)}% win rate with ${totalExposure.toFixed(1)} lots exposure`,
        value: winRate,
        threshold: 30,
        priority: 'high',
        timestamp: new Date()
      };
    }

    return null;
  }

  private async sendAlert(alert: Alert): Promise<void> {
    // Check alert rate limit (max 5 per user per hour)
    const alertKey = `${alert.userId}:${new Date().getHours()}`;
    const currentCount = this.alertCounts.get(alertKey) || 0;
    
    if (currentCount >= 5) {
      return; // Rate limit exceeded
    }

    try {
      // Store alert in database
      await DatabaseService.run(
        `INSERT INTO alerts 
         (id, user_id, type, symbol, condition_text, value, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
        [alert.id, alert.userId, alert.type, alert.symbol || null, alert.message, alert.value]
      );

      // Send to subscribed user
      const subscription = this.subscriptions.get(alert.userId);
      if (subscription) {
        this.sendSSEMessage(subscription.response, {
          type: 'alert',
          data: alert
        });
      }

      // Update alert count
      this.alertCounts.set(alertKey, currentCount + 1);

      logger.info(`Alert sent to user ${alert.userId}: ${alert.message}`);

    } catch (error) {
      logger.error('Error sending alert:', error);
    }
  }

  private sendHeartbeat(userId: string): void {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      this.sendSSEMessage(subscription.response, {
        type: 'heartbeat',
        data: { timestamp: new Date().toISOString() }
      });
      subscription.lastHeartbeat = new Date();
    }
  }

  private sendSSEMessage(response: Response, message: { type: string; data: any }): void {
    try {
      const sseData = `data: ${JSON.stringify(message)}\n\n`;
      response.write(sseData);
    } catch (error) {
      logger.error('Error sending SSE message:', error);
    }
  }

  private cleanupDeadConnections(): void {
    const now = new Date();
    const timeout = 2 * 60 * 1000; // 2 minutes

    for (const [userId, subscription] of this.subscriptions.entries()) {
      if (now.getTime() - subscription.lastHeartbeat.getTime() > timeout) {
        logger.info(`Cleaning up dead connection for user ${userId}`);
        this.unsubscribe(userId);
      }
    }
  }

  private calculateCurrentDrawdown(trades: any[]): number {
    if (trades.length === 0) return 0;
    
    let peak = 0;
    let currentDrawdown = 0;
    let runningTotal = 0;
    
    // Sort trades by time
    const sortedTrades = trades.sort((a, b) => a.mt5_time - b.mt5_time);
    
    for (const trade of sortedTrades) {
      runningTotal += trade.profit;
      
      if (runningTotal > peak) {
        peak = runningTotal;
      }
      
      if (peak > 0) {
        currentDrawdown = ((peak - runningTotal) / peak) * 100;
      }
    }
    
    return Math.max(0, currentDrawdown);
  }

  private groupTradesBySymbol(trades: any[]): Record<string, any[]> {
    return trades.reduce((groups, trade) => {
      const symbol = trade.symbol;
      if (!groups[symbol]) {
        groups[symbol] = [];
      }
      groups[symbol].push(trade);
      return groups;
    }, {});
  }

  getActiveSubscriptions(): number {
    return this.subscriptions.size;
  }
}

export const alertService = AlertService.getInstance();