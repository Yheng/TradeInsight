import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';

/**
 * Broker Integration Controller
 * Provides RESTful APIs for broker system integration (CRM, trading platforms)
 * All endpoints require admin authentication and API key validation
 */
export class BrokerController {
  /**
   * Get aggregated user analytics for broker CRM integration
   * GET /api/broker/users?limit=100&offset=0&sort=win_rate&order=desc
   */
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;
      const apiKey = req.headers['x-api-key'] as string;

      // Validate admin access and API key
      if (userRole !== 'admin' || !apiKey) {
        return res.status(401).json({
          error: 'Admin access and valid API key required',
          code: 401
        });
      }

      // Validate API key (simplified - in production, store hashed keys in database)
      const validApiKeys = process.env.BROKER_API_KEYS?.split(',') || [];
      if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key',
          code: 401
        });
      }

      const { limit = 100, offset = 0, sort = 'created_at', order = 'desc' } = req.query;

      // Validate pagination parameters
      const limitNum = Math.min(parseInt(limit as string) || 100, 1000);
      const offsetNum = Math.max(parseInt(offset as string) || 0, 0);

      // Validate sort parameters
      const allowedSortFields = ['created_at', 'win_rate', 'total_trades', 'total_profit', 'retention_score'];
      const sortField = allowedSortFields.includes(sort as string) ? sort : 'created_at';
      const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

      const users = await DatabaseService.all(`
        SELECT 
          u.id as user_id,
          u.email,
          u.created_at,
          u.updated_at,
          u.is_email_verified,
          rm.win_rate,
          rm.max_drawdown as drawdown,
          rm.risk_score,
          rm.profit_factor,
          COUNT(t.id) as total_trades,
          SUM(t.profit) as total_profit,
          SUM(t.volume) as total_volume,
          CASE 
            WHEN rm.win_rate >= 70 AND COUNT(t.id) >= 50 THEN 9.0
            WHEN rm.win_rate >= 60 AND COUNT(t.id) >= 25 THEN 8.0
            WHEN rm.win_rate >= 50 AND COUNT(t.id) >= 10 THEN 7.0
            WHEN COUNT(t.id) >= 5 THEN 6.0
            ELSE 5.0
          END as retention_score
        FROM users u
        LEFT JOIN risk_metrics rm ON u.id = rm.user_id
        LEFT JOIN trades t ON u.id = t.user_id
        WHERE u.role = 'user'
        GROUP BY u.id
        ORDER BY ${sortField} ${sortOrder}
        LIMIT ? OFFSET ?
      `, [limitNum, offsetNum]);

      // Get total count for pagination
      const totalResult = await DatabaseService.get<{ total: number }>(`
        SELECT COUNT(*) as total FROM users WHERE role = 'user'
      `);

      res.json({
        success: true,
        data: users.map(user => ({
          user_id: user.user_id,
          win_rate: parseFloat(String(user.win_rate || 0)),
          drawdown: parseFloat(String(user.drawdown || 0)),
          retention_score: parseFloat(String(user.retention_score || 5.0)),
          total_trades: parseInt(String(user.total_trades || 0)),
          total_profit: parseFloat(String(user.total_profit || 0)),
          total_volume: parseFloat(String(user.total_volume || 0)),
          risk_score: parseFloat(String(user.risk_score || 5.0)),
          profit_factor: parseFloat(String(user.profit_factor || 0)),
          created_at: user.created_at,
          last_active: user.updated_at,
          is_verified: !!user.is_email_verified
        })),
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: totalResult?.total || 0,
          has_more: (offsetNum + limitNum) < (totalResult?.total || 0)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Error in broker getUsers:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * Get platform analytics for broker dashboards
   * GET /api/broker/analytics?timeframe=30d
   */
  static async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;
      const apiKey = req.headers['x-api-key'] as string;

      if (userRole !== 'admin' || !apiKey) {
        return res.status(401).json({
          error: 'Admin access and valid API key required',
          code: 401
        });
      }

      const validApiKeys = process.env.BROKER_API_KEYS?.split(',') || [];
      if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key',
          code: 401
        });
      }

      const { timeframe = '30d' } = req.query;
      
      // Calculate date filter
      const now = new Date();
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 30;
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

      // Platform overview metrics
      const overview = await DatabaseService.get(`
        SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT CASE WHEN u.created_at >= ? THEN u.id END) as new_users,
          COUNT(DISTINCT CASE WHEN u.updated_at >= ? THEN u.id END) as active_users,
          COUNT(DISTINCT t.id) as total_trades,
          COUNT(DISTINCT CASE WHEN t.created_at >= ? THEN t.id END) as recent_trades,
          AVG(rm.win_rate) as avg_win_rate,
          AVG(rm.risk_score) as avg_risk_score,
          SUM(CASE WHEN t.created_at >= ? THEN t.profit ELSE 0 END) as recent_profit
        FROM users u
        LEFT JOIN trades t ON u.id = t.user_id
        LEFT JOIN risk_metrics rm ON u.id = rm.user_id
        WHERE u.role = 'user'
      `, [startDate.toISOString(), startDate.toISOString(), startDate.toISOString(), startDate.toISOString()]);

      // Trading performance distribution
      const performanceDistribution = await DatabaseService.all(`
        SELECT 
          CASE 
            WHEN rm.win_rate >= 80 THEN 'excellent'
            WHEN rm.win_rate >= 60 THEN 'good'
            WHEN rm.win_rate >= 40 THEN 'average'
            ELSE 'poor'
          END as performance_tier,
          COUNT(*) as user_count,
          AVG(rm.win_rate) as avg_win_rate,
          AVG(rm.profit_factor) as avg_profit_factor
        FROM risk_metrics rm
        JOIN users u ON rm.user_id = u.id
        WHERE u.role = 'user' AND rm.last_updated >= ?
        GROUP BY performance_tier
      `, [startDate.toISOString()]);

      // Top symbols traded
      const topSymbols = await DatabaseService.all(`
        SELECT 
          symbol,
          COUNT(*) as trade_count,
          AVG(CASE WHEN profit > 0 THEN 1.0 ELSE 0.0 END) as success_rate,
          SUM(profit) as total_profit,
          AVG(volume) as avg_volume
        FROM trades
        WHERE created_at >= ?
        GROUP BY symbol
        ORDER BY trade_count DESC
        LIMIT 10
      `, [startDate.toISOString()]);

      // User retention metrics
      const retentionMetrics = await DatabaseService.get(`
        SELECT 
          COUNT(CASE WHEN u.updated_at >= ? THEN 1 END) as weekly_active,
          COUNT(CASE WHEN u.updated_at >= ? THEN 1 END) as monthly_active,
          AVG(
            CASE 
              WHEN rm.win_rate >= 70 AND total_trades.trade_count >= 50 THEN 9.0
              WHEN rm.win_rate >= 60 AND total_trades.trade_count >= 25 THEN 8.0
              WHEN rm.win_rate >= 50 AND total_trades.trade_count >= 10 THEN 7.0
              WHEN total_trades.trade_count >= 5 THEN 6.0
              ELSE 5.0
            END
          ) as avg_retention_score
        FROM users u
        LEFT JOIN risk_metrics rm ON u.id = rm.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as trade_count
          FROM trades
          GROUP BY user_id
        ) total_trades ON u.id = total_trades.user_id
        WHERE u.role = 'user'
      `, [
        new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString(),
        startDate.toISOString()
      ]);

      res.json({
        success: true,
        data: {
          overview: {
            total_users: parseInt(String(overview?.total_users || 0)),
            new_users: parseInt(String(overview?.new_users || 0)),
            active_users: parseInt(String(overview?.active_users || 0)),
            total_trades: parseInt(String(overview?.total_trades || 0)),
            recent_trades: parseInt(String(overview?.recent_trades || 0)),
            avg_win_rate: parseFloat(String(overview?.avg_win_rate || 0)),
            avg_risk_score: parseFloat(String(overview?.avg_risk_score || 5.0)),
            recent_profit: parseFloat(String(overview?.recent_profit || 0))
          },
          performance_distribution: performanceDistribution.map(tier => ({
            tier: tier.performance_tier,
            user_count: parseInt(String(tier.user_count)),
            avg_win_rate: parseFloat(String(tier.avg_win_rate || 0)),
            avg_profit_factor: parseFloat(String(tier.avg_profit_factor || 0))
          })),
          top_symbols: topSymbols.map(symbol => ({
            symbol: symbol.symbol,
            trade_count: parseInt(String(symbol.trade_count)),
            success_rate: parseFloat(String(symbol.success_rate || 0)) * 100,
            total_profit: parseFloat(String(symbol.total_profit || 0)),
            avg_volume: parseFloat(String(symbol.avg_volume || 0))
          })),
          retention_metrics: {
            weekly_active_users: parseInt(String(retentionMetrics?.weekly_active || 0)),
            monthly_active_users: parseInt(String(retentionMetrics?.monthly_active || 0)),
            avg_retention_score: parseFloat(String(retentionMetrics?.avg_retention_score || 5.0))
          }
        },
        timeframe,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Error in broker getAnalytics:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * Get risk management data for compliance monitoring
   * GET /api/broker/risk?threshold=high
   */
  static async getRiskData(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;
      const apiKey = req.headers['x-api-key'] as string;

      if (userRole !== 'admin' || !apiKey) {
        return res.status(401).json({
          error: 'Admin access and valid API key required',
          code: 401
        });
      }

      const validApiKeys = process.env.BROKER_API_KEYS?.split(',') || [];
      if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key',
          code: 401
        });
      }

      const { threshold = 'medium' } = req.query;

      // Define risk thresholds
      let riskScoreFilter = 'rm.risk_score >= 5.0';
      if (threshold === 'high') {
        riskScoreFilter = 'rm.risk_score >= 8.0';
      } else if (threshold === 'low') {
        riskScoreFilter = 'rm.risk_score < 4.0';
      }

      const riskData = await DatabaseService.all(`
        SELECT 
          u.id as user_id,
          rm.risk_score,
          rm.max_drawdown,
          rm.win_rate,
          rm.profit_factor,
          rp.max_leverage,
          rp.risk_tolerance,
          COUNT(a.id) as active_alerts,
          COUNT(t.id) as total_trades,
          SUM(CASE WHEN t.profit < 0 THEN ABS(t.profit) ELSE 0 END) as total_losses,
          MAX(t.created_at) as last_trade_date
        FROM users u
        JOIN risk_metrics rm ON u.id = rm.user_id
        LEFT JOIN user_risk_profiles rp ON u.id = rp.user_id
        LEFT JOIN alerts a ON u.id = a.user_id AND a.is_active = 1
        LEFT JOIN trades t ON u.id = t.user_id
        WHERE u.role = 'user' AND ${riskScoreFilter}
        GROUP BY u.id
        ORDER BY rm.risk_score DESC
        LIMIT 100
      `);

      // Calculate risk distribution
      const riskDistribution = await DatabaseService.all(`
        SELECT 
          CASE 
            WHEN rm.risk_score >= 8.0 THEN 'high'
            WHEN rm.risk_score >= 6.0 THEN 'medium'
            WHEN rm.risk_score >= 4.0 THEN 'low'
            ELSE 'very_low'
          END as risk_level,
          COUNT(*) as user_count,
          AVG(rm.risk_score) as avg_risk_score,
          AVG(rm.max_drawdown) as avg_drawdown
        FROM risk_metrics rm
        JOIN users u ON rm.user_id = u.id
        WHERE u.role = 'user'
        GROUP BY risk_level
      `);

      res.json({
        success: true,
        data: {
          high_risk_users: riskData.map(user => ({
            user_id: user.user_id,
            risk_score: parseFloat(String(user.risk_score || 5.0)),
            max_drawdown: parseFloat(String(user.max_drawdown || 0)),
            win_rate: parseFloat(String(user.win_rate || 0)),
            profit_factor: parseFloat(String(user.profit_factor || 0)),
            max_leverage: parseFloat(String(user.max_leverage || 100)),
            risk_tolerance: user.risk_tolerance || 'medium',
            active_alerts: parseInt(String(user.active_alerts || 0)),
            total_trades: parseInt(String(user.total_trades || 0)),
            total_losses: parseFloat(String(user.total_losses || 0)),
            last_trade_date: user.last_trade_date
          })),
          risk_distribution: riskDistribution.map(level => ({
            risk_level: level.risk_level,
            user_count: parseInt(String(level.user_count)),
            avg_risk_score: parseFloat(String(level.avg_risk_score || 5.0)),
            avg_drawdown: parseFloat(String(level.avg_drawdown || 0))
          }))
        },
        threshold,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Error in broker getRiskData:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 500
      });
    }
  }

  /**
   * Sync user data to broker CRM systems
   * POST /api/broker/sync
   */
  static async syncData(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;
      const apiKey = req.headers['x-api-key'] as string;

      if (userRole !== 'admin' || !apiKey) {
        return res.status(401).json({
          error: 'Admin access and valid API key required',
          code: 401
        });
      }

      const validApiKeys = process.env.BROKER_API_KEYS?.split(',') || [];
      if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
          error: 'Invalid API key',
          code: 401
        });
      }

      const { user_ids, sync_type = 'full' } = req.body;

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({
          error: 'user_ids array is required',
          code: 400
        });
      }

      // Limit batch size
      if (user_ids.length > 100) {
        return res.status(400).json({
          error: 'Maximum 100 users per sync request',
          code: 400
        });
      }

      const placeholders = user_ids.map(() => '?').join(',');
      const syncData = await DatabaseService.all(`
        SELECT 
          u.id as user_id,
          u.email,
          u.created_at,
          u.updated_at,
          rm.win_rate,
          rm.max_drawdown,
          rm.risk_score,
          rm.profit_factor,
          COUNT(t.id) as total_trades,
          SUM(t.profit) as total_profit,
          MAX(t.created_at) as last_trade_date,
          CASE 
            WHEN rm.win_rate >= 70 AND COUNT(t.id) >= 50 THEN 9.0
            WHEN rm.win_rate >= 60 AND COUNT(t.id) >= 25 THEN 8.0
            WHEN rm.win_rate >= 50 AND COUNT(t.id) >= 10 THEN 7.0
            WHEN COUNT(t.id) >= 5 THEN 6.0
            ELSE 5.0
          END as retention_score
        FROM users u
        LEFT JOIN risk_metrics rm ON u.id = rm.user_id
        LEFT JOIN trades t ON u.id = t.user_id
        WHERE u.id IN (${placeholders}) AND u.role = 'user'
        GROUP BY u.id
      `, user_ids);

      // Log sync activity
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [
          require('uuid').v4(),
          req.user?.id,
          'BROKER_SYNC',
          `Synced ${syncData.length} users via API (${sync_type})`
        ]
      );

      res.json({
        success: true,
        data: {
          users: syncData.map(user => ({
            user_id: user.user_id,
            win_rate: parseFloat(String(user.win_rate || 0)),
            drawdown: parseFloat(String(user.max_drawdown || 0)),
            retention_score: parseFloat(String(user.retention_score || 5.0)),
            total_trades: parseInt(String(user.total_trades || 0)),
            total_profit: parseFloat(String(user.total_profit || 0)),
            risk_score: parseFloat(String(user.risk_score || 5.0)),
            profit_factor: parseFloat(String(user.profit_factor || 0)),
            last_trade_date: user.last_trade_date,
            last_updated: user.updated_at
          })),
          sync_type,
          synced_count: syncData.length,
          failed_count: user_ids.length - syncData.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Error in broker syncData:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 500
      });
    }
  }
}