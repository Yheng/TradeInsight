import { EventEmitter } from 'events';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { logger } from '@tradeinsight/utils';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  network?: {
    bytesReceived: number;
    bytesSent: number;
  };
  process: {
    pid: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpu: {
      user: number;
      system: number;
    };
    uptime: number;
  };
}

export interface ApplicationMetrics {
  timestamp: number;
  requests: {
    total: number;
    success: number;
    errors: number;
    avgResponseTime: number;
  };
  database: {
    connections: number;
    queryTime: number;
    errors: number;
  };
  api: {
    auth: number;
    trades: number;
    analytics: number;
    alerts: number;
  };
  users: {
    active: number;
    total: number;
    sessions: number;
  };
}

export interface PerformanceAlert {
  type: 'cpu' | 'memory' | 'disk' | 'response_time' | 'error_rate' | 'database';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

class MonitoringService extends EventEmitter {
  private systemMetrics: SystemMetrics[] = [];
  private appMetrics: ApplicationMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeSum = 0;
  private lastRequestReset = Date.now();
  
  // Thresholds for alerts
  private thresholds = {
    cpu: 80, // 80% CPU usage
    memory: 85, // 85% memory usage
    disk: 90, // 90% disk usage
    responseTime: 5000, // 5 seconds
    errorRate: 10, // 10% error rate
    databaseResponseTime: 1000 // 1 second
  };

  constructor() {
    super();
    this.setupProcessMonitoring();
  }

  async start(intervalMs: number = 30000): Promise<void> {
    if (this.isRunning) {
      logger.warn('Monitoring service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting performance monitoring service', { interval: intervalMs });

    // Collect initial metrics
    await this.collectMetrics();

    // Set up periodic collection
    this.intervalId = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        logger.error('Failed to collect metrics', { error: error.message });
      }
    }, intervalMs);

    this.emit('started');
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    logger.info('Performance monitoring service stopped');
    this.emit('stopped');
  }

  private async collectMetrics(): Promise<void> {
    try {
      const timestamp = Date.now();

      // Collect system metrics
      const systemMetrics = await this.getSystemMetrics(timestamp);
      this.systemMetrics.push(systemMetrics);

      // Collect application metrics
      const appMetrics = await this.getApplicationMetrics(timestamp);
      this.appMetrics.push(appMetrics);

      // Check for alerts (with error handling)
      await this.checkAlerts(systemMetrics, appMetrics);

      // Cleanup old metrics (keep last 24 hours)
      const cutoff = timestamp - (24 * 60 * 60 * 1000);
      this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);
      this.appMetrics = this.appMetrics.filter(m => m.timestamp > cutoff);
      this.alerts = this.alerts.filter(a => a.timestamp > cutoff);

      this.emit('metrics', { systemMetrics, appMetrics });
    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  private async getSystemMetrics(timestamp: number): Promise<SystemMetrics> {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Get disk usage (for the current directory)
    const diskUsage = await this.getDiskUsage();

    return {
      timestamp,
      cpu: {
        usage: await this.getCpuUsage(),
        loadAverage: os.loadavg()
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent: (usedMem / totalMem) * 100
      },
      disk: diskUsage,
      process: {
        pid: process.pid,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      }
    };
  }

  private async getApplicationMetrics(timestamp: number): Promise<ApplicationMetrics> {
    const timeSinceReset = timestamp - this.lastRequestReset;
    const requestsPerSecond = timeSinceReset > 0 ? (this.requestCount / (timeSinceReset / 1000)) : 0;
    const errorRate = this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;
    const avgResponseTime = this.requestCount > 0 ? this.responseTimeSum / this.requestCount : 0;

    return {
      timestamp,
      requests: {
        total: this.requestCount,
        success: this.requestCount - this.errorCount,
        errors: this.errorCount,
        avgResponseTime
      },
      database: {
        connections: 1, // SQLite uses a single connection
        queryTime: 0, // Would need to be tracked separately
        errors: 0 // Would need to be tracked separately
      },
      api: {
        auth: 0, // Would need to be tracked per endpoint
        trades: 0,
        analytics: 0,
        alerts: 0
      },
      users: {
        active: 0, // Would need to track active sessions
        total: 0, // Would query from database
        sessions: 0
      }
    };
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      try {
        const start = process.hrtime();
        const startUsage = process.cpuUsage();

        setTimeout(() => {
          try {
            const end = process.hrtime(start);
            const endUsage = process.cpuUsage(startUsage);
            
            const totalTime = end[0] * 1000000 + end[1] / 1000; // microseconds
            const cpuTime = endUsage.user + endUsage.system; // microseconds
            
            if (totalTime === 0) {
              resolve(0);
              return;
            }
            
            const usage = (cpuTime / totalTime) * 100;
            const result = Math.min(100, Math.max(0, usage));
            
            if (isNaN(result) || !isFinite(result)) {
              resolve(0);
              return;
            }
            
            resolve(result);
          } catch (error) {
            logger.warn('Error calculating CPU usage in timeout', { error: error.message });
            resolve(0);
          }
        }, 100);
      } catch (error) {
        logger.warn('Error starting CPU usage calculation', { error: error.message });
        resolve(0);
      }
    });
  }

  private async getDiskUsage(): Promise<{
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  }> {
    try {
      const stats = fs.statSync('.');
      // This is a simplified version - in production you'd want to check actual disk space
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
        free: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        used: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        usagePercent: 50 // 50% placeholder
      };
    } catch (error) {
      return {
        total: 0,
        free: 0,
        used: 0,
        usagePercent: 0
      };
    }
  }

  private async checkAlerts(
    systemMetrics: SystemMetrics, 
    appMetrics: ApplicationMetrics
  ): Promise<void> {
    try {
      const alerts: PerformanceAlert[] = [];

    // CPU usage alert
    if (systemMetrics.cpu && systemMetrics.cpu.usage != null && systemMetrics.cpu.usage > this.thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        severity: systemMetrics.cpu.usage > 95 ? 'critical' : 'high',
        message: `High CPU usage: ${systemMetrics.cpu.usage.toFixed(1)}%`,
        value: systemMetrics.cpu.usage,
        threshold: this.thresholds.cpu,
        timestamp: systemMetrics.timestamp
      });
    }

    // Memory usage alert
    if (systemMetrics.memory && systemMetrics.memory.usagePercent != null && systemMetrics.memory.usagePercent > this.thresholds.memory) {
      alerts.push({
        type: 'memory',
        severity: systemMetrics.memory.usagePercent > 95 ? 'critical' : 'high',
        message: `High memory usage: ${systemMetrics.memory.usagePercent.toFixed(1)}%`,
        value: systemMetrics.memory.usagePercent,
        threshold: this.thresholds.memory,
        timestamp: systemMetrics.timestamp
      });
    }

    // Disk usage alert
    if (systemMetrics.disk && systemMetrics.disk.usagePercent != null && systemMetrics.disk.usagePercent > this.thresholds.disk) {
      alerts.push({
        type: 'disk',
        severity: systemMetrics.disk.usagePercent > 98 ? 'critical' : 'high',
        message: `High disk usage: ${systemMetrics.disk.usagePercent.toFixed(1)}%`,
        value: systemMetrics.disk.usagePercent,
        threshold: this.thresholds.disk,
        timestamp: systemMetrics.timestamp
      });
    }

    // Response time alert
    if (appMetrics.requests && appMetrics.requests.avgResponseTime != null && appMetrics.requests.avgResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: appMetrics.requests.avgResponseTime > 10000 ? 'critical' : 'medium',
        message: `High response time: ${appMetrics.requests.avgResponseTime.toFixed(0)}ms`,
        value: appMetrics.requests.avgResponseTime,
        threshold: this.thresholds.responseTime,
        timestamp: appMetrics.timestamp
      });
    }

    // Error rate alert
    const errorRate = appMetrics.requests && appMetrics.requests.total > 0 ? 
      (appMetrics.requests.errors / appMetrics.requests.total) * 100 : 0;
    
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: errorRate > 25 ? 'critical' : 'medium',
        message: `High error rate: ${errorRate.toFixed(1)}%`,
        value: errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: appMetrics.timestamp
      });
    }

      // Process new alerts
      for (const alert of alerts) {
        this.alerts.push(alert);
        this.emit('alert', alert);
        
        logger.warn('Performance alert', {
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold
        });
      }
    } catch (error) {
      logger.error('Error checking alerts:', error);
    }
  }

  private setupProcessMonitoring(): void {
    // Monitor uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      this.emit('error', { type: 'uncaughtException', error });
    });

    // Monitor unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      this.emit('error', { type: 'unhandledRejection', reason, promise });
    });

    // Monitor process warnings
    process.on('warning', (warning) => {
      logger.warn('Process warning', { 
        name: warning.name, 
        message: warning.message,
        stack: warning.stack 
      });
    });
  }

  // Methods for tracking application metrics
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.responseTimeSum += responseTime;
    
    if (isError) {
      this.errorCount++;
    }
  }

  resetRequestMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
    this.lastRequestReset = Date.now();
  }

  // Getters for metrics
  getSystemMetrics(limit: number = 100): SystemMetrics[] {
    return this.systemMetrics.slice(-limit);
  }

  getApplicationMetrics(limit: number = 100): ApplicationMetrics[] {
    return this.appMetrics.slice(-limit);
  }

  getAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  getCurrentStatus(): {
    isRunning: boolean;
    uptime: number;
    lastMetricsCollection: number | null;
    alertCount: number;
  } {
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      lastMetricsCollection: this.systemMetrics.length > 0 ? 
        this.systemMetrics[this.systemMetrics.length - 1].timestamp : null,
      alertCount: this.alerts.length
    };
  }

  updateThresholds(newThresholds: Partial<typeof this.thresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Monitoring thresholds updated', { thresholds: this.thresholds });
  }
}

export const monitoringService = new MonitoringService();