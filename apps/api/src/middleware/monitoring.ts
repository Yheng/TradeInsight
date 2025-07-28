import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/MonitoringService';
import { logger } from '@tradeinsight/utils';

export interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  timestamp: number;
}

class RequestMonitor {
  private requestMetrics: RequestMetrics[] = [];
  private maxMetrics = 10000; // Keep last 10k requests

  recordRequest(metrics: RequestMetrics): void {
    this.requestMetrics.push(metrics);
    
    // Cleanup old metrics
    if (this.requestMetrics.length > this.maxMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetrics);
    }

    // Record in monitoring service
    const isError = metrics.statusCode >= 400;
    monitoringService.recordRequest(metrics.responseTime, isError);
  }

  getMetrics(limit: number = 100): RequestMetrics[] {
    return this.requestMetrics.slice(-limit);
  }

  getAggregatedMetrics(timeWindowMs: number = 60000): {
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
    requestsPerSecond: number;
    statusCodes: Record<number, number>;
    topEndpoints: Array<{ path: string; count: number; avgTime: number }>;
  } {
    const cutoff = Date.now() - timeWindowMs;
    const recentMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        requestsPerSecond: 0,
        statusCodes: {},
        topEndpoints: []
      };
    }

    const totalRequests = recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;
    const requestsPerSecond = (totalRequests / (timeWindowMs / 1000));

    // Count status codes
    const statusCodes = recentMetrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Top endpoints
    const endpointStats = recentMetrics.reduce((acc, m) => {
      const key = `${m.method} ${m.path}`;
      if (!acc[key]) {
        acc[key] = { count: 0, totalTime: 0 };
      }
      acc[key].count++;
      acc[key].totalTime += m.responseTime;
      return acc;
    }, {} as Record<string, { count: number; totalTime: number }>);

    const topEndpoints = Object.entries(endpointStats)
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      avgResponseTime,
      errorRate,
      requestsPerSecond,
      statusCodes,
      topEndpoints
    };
  }
}

const requestMonitor = new RequestMonitor();

export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const _startTime = Date.now();
  const startHrTime = process.hrtime();

  // Override res.end to capture metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const endTime = Date.now();
    const diff = process.hrtime(startHrTime);
    const responseTime = diff[0] * 1000 + diff[1] * 1e-6; // Convert to milliseconds

    // Record request metrics
    const metrics: RequestMetrics = {
      path: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.id,
      timestamp: endTime
    };

    requestMonitor.recordRequest(metrics);

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        path: metrics.path,
        method: metrics.method,
        responseTime: Math.round(responseTime),
        statusCode: metrics.statusCode,
        userId: metrics.userId
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Error response', {
        path: metrics.path,
        method: metrics.method,
        statusCode: metrics.statusCode,
        responseTime: Math.round(responseTime),
        userId: metrics.userId,
        userAgent: metrics.userAgent
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

export const healthCheckMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add health check data to requests
  (req as any).healthCheck = {
    timestamp: Date.now(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    version: process.version
  };
  
  next();
};

export { requestMonitor };