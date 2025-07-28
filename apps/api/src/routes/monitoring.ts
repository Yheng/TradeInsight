import express from 'express';
import { query, validationResult } from 'express-validator';
import { monitoringService } from '../services/MonitoringService';
import { requestMonitor } from '../middleware/monitoring';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '@tradeinsight/types';

const router = express.Router();

// Get system metrics (admin only)
router.get('/system', [
  requireRole([UserRole.ADMIN]),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt()
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { limit = 100 } = req.query;
  const metrics = monitoringService.getSystemMetrics(limit as number);

  res.json({
    success: true,
    data: {
      metrics,
      count: metrics.length,
      latest: metrics[metrics.length - 1] || null
    }
  });
}));

// Get application metrics (admin only)
router.get('/application', [
  requireRole([UserRole.ADMIN]),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt()
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { limit = 100 } = req.query;
  const metrics = monitoringService.getApplicationMetrics(limit as number);

  res.json({
    success: true,
    data: {
      metrics,
      count: metrics.length,
      latest: metrics[metrics.length - 1] || null
    }
  });
}));

// Get performance alerts (admin only)
router.get('/alerts', [
  requireRole([UserRole.ADMIN]),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical'])
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { limit = 50, severity } = req.query;
  let alerts = monitoringService.getAlerts(limit as number);

  if (severity) {
    alerts = alerts.filter(alert => alert.severity === severity);
  }

  res.json({
    success: true,
    data: {
      alerts,
      count: alerts.length
    }
  });
}));

// Get request metrics (admin only)
router.get('/requests', [
  requireRole([UserRole.ADMIN]),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('window').optional().isInt({ min: 60000, max: 86400000 }).toInt() // 1 minute to 24 hours
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { limit = 100, window = 3600000 } = req.query; // Default 1 hour window
  const recentRequests = requestMonitor.getMetrics(limit as number);
  const aggregated = requestMonitor.getAggregatedMetrics(window as number);

  res.json({
    success: true,
    data: {
      recent: recentRequests,
      aggregated,
      window: window
    }
  });
}));

// Get monitoring status (admin only)
router.get('/status', 
  requireRole([UserRole.ADMIN]),
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const status = monitoringService.getCurrentStatus();
    
    res.json({
      success: true,
      data: status
    });
  })
);

// Update monitoring thresholds (admin only)
router.post('/thresholds', [
  requireRole([UserRole.ADMIN])
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { cpu, memory, disk, responseTime, errorRate, databaseResponseTime } = req.body;
  
  const newThresholds: any = {};
  
  if (typeof cpu === 'number' && cpu > 0 && cpu <= 100) {
    newThresholds.cpu = cpu;
  }
  if (typeof memory === 'number' && memory > 0 && memory <= 100) {
    newThresholds.memory = memory;
  }
  if (typeof disk === 'number' && disk > 0 && disk <= 100) {
    newThresholds.disk = disk;
  }
  if (typeof responseTime === 'number' && responseTime > 0) {
    newThresholds.responseTime = responseTime;
  }
  if (typeof errorRate === 'number' && errorRate > 0 && errorRate <= 100) {
    newThresholds.errorRate = errorRate;
  }
  if (typeof databaseResponseTime === 'number' && databaseResponseTime > 0) {
    newThresholds.databaseResponseTime = databaseResponseTime;
  }

  if (Object.keys(newThresholds).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid thresholds provided'
    });
  }

  monitoringService.updateThresholds(newThresholds);

  res.json({
    success: true,
    message: 'Monitoring thresholds updated',
    data: {
      updated: newThresholds
    }
  });
}));

// Start monitoring (admin only)
router.post('/start', [
  requireRole([UserRole.ADMIN]),
  query('interval').optional().isInt({ min: 5000, max: 300000 }).toInt() // 5 seconds to 5 minutes
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { interval = 30000 } = req.query;
  
  try {
    await monitoringService.start(interval as number);
    
    res.json({
      success: true,
      message: 'Monitoring service started',
      data: {
        interval: interval
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}));

// Stop monitoring (admin only)
router.post('/stop', 
  requireRole([UserRole.ADMIN]),
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    monitoringService.stop();
    
    res.json({
      success: true,
      message: 'Monitoring service stopped'
    });
  })
);

// Health check endpoint (public, but limited info)
router.get('/health', asyncHandler(async (req: Request, res: any) => {
  const status = monitoringService.getCurrentStatus();
  const memUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      status: 'healthy',
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) // MB
      },
      timestamp: new Date().toISOString(),
      version: process.version,
      monitoring: {
        isRunning: status.isRunning,
        alertCount: status.alertCount
      }
    }
  });
}));

export default router;