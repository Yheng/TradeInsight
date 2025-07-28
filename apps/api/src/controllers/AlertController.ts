import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { alertService } from '../services/AlertService';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';

export class AlertController {
  static async subscribeToAlerts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Subscribe user to real-time alerts via SSE
      alertService.subscribe(userId, res);

      // Log subscription
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'ALERT_SUBSCRIBE', 'Subscribed to real-time alerts']
      );

    } catch (error: any) {
      logger.error('Error in subscribeToAlerts:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getAlertHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit = 50, type, isActive } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      let query = 'SELECT * FROM alerts WHERE user_id = ?';
      const params: any[] = [userId];

      if (type) {
        query += ' AND type = ?';
        params.push(type as string);
      }

      if (isActive !== undefined) {
        query += ' AND is_active = ?';
        params.push(isActive === 'true' ? 1 : 0);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(parseInt(limit as string) || 50);

      const alerts = await DatabaseService.all(query, params);

      res.json({
        success: true,
        alerts,
        count: alerts.length
      });

    } catch (error: any) {
      logger.error('Error in getAlertHistory:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async createCustomAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, symbol, conditionText, value } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      if (!type || !conditionText || value === undefined) {
        return res.status(400).json({
          success: false,
          error: 'type, conditionText, and value are required'
        });
      }

      // Validate alert type
      const validTypes = ['price_alert', 'volume_alert', 'indicator_alert'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid alert type'
        });
      }

      const alertId = uuidv4();

      await DatabaseService.run(
        `INSERT INTO alerts 
         (id, user_id, type, symbol, condition_text, value, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [alertId, userId, type, symbol || null, conditionText, value]
      );

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'ALERT_CREATE', `Created custom alert: ${conditionText}`]
      );

      res.json({
        success: true,
        alertId,
        message: 'Custom alert created successfully'
      });

    } catch (error: any) {
      logger.error('Error in createCustomAlert:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async updateAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { alertId } = req.params;
      const { isActive, isTriggered } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Verify alert belongs to user
      const alert = await DatabaseService.get(
        'SELECT id FROM alerts WHERE id = ? AND user_id = ?',
        [alertId, userId]
      );

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      // Build update query
      const updates: string[] = [];
      const params: any[] = [];

      if (isActive !== undefined) {
        updates.push('is_active = ?');
        params.push(isActive ? 1 : 0);
      }

      if (isTriggered !== undefined) {
        updates.push('is_triggered = ?');
        params.push(isTriggered ? 1 : 0);
        
        if (isTriggered) {
          updates.push('triggered_at = CURRENT_TIMESTAMP');
        }
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      params.push(alertId);

      await DatabaseService.run(
        `UPDATE alerts SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'ALERT_UPDATE', `Updated alert ${alertId}`]
      );

      res.json({
        success: true,
        message: 'Alert updated successfully'
      });

    } catch (error: any) {
      logger.error('Error in updateAlert:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async deleteAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { alertId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Verify alert belongs to user
      const alert = await DatabaseService.get(
        'SELECT id FROM alerts WHERE id = ? AND user_id = ?',
        [alertId, userId]
      );

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }

      await DatabaseService.run(
        'DELETE FROM alerts WHERE id = ?',
        [alertId]
      );

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'ALERT_DELETE', `Deleted alert ${alertId}`]
      );

      res.json({
        success: true,
        message: 'Alert deleted successfully'
      });

    } catch (error: any) {
      logger.error('Error in deleteAlert:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getAlertStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Get alert statistics
      const stats = await DatabaseService.all<{
        total_alerts: number;
        active_alerts: number;
        triggered_alerts: number;
        type: string;
        count_by_type: number;
      }>(
        `SELECT 
           COUNT(*) as total_alerts,
           COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_alerts,
           COUNT(CASE WHEN is_triggered = 1 THEN 1 END) as triggered_alerts,
           type,
           COUNT(*) as count_by_type
         FROM alerts 
         WHERE user_id = ? 
         GROUP BY type`,
        [userId]
      );

      const totalStats = await DatabaseService.get<{
        total_alerts: number;
        active_alerts: number;
        triggered_alerts: number;
      }>(
        `SELECT 
           COUNT(*) as total_alerts,
           COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_alerts,
           COUNT(CASE WHEN is_triggered = 1 THEN 1 END) as triggered_alerts
         FROM alerts 
         WHERE user_id = ?`,
        [userId]
      );

      res.json({
        success: true,
        stats: {
          total: totalStats?.total_alerts || 0,
          active: totalStats?.active_alerts || 0,
          triggered: totalStats?.triggered_alerts || 0,
          byType: stats.map(s => ({
            type: s.type,
            count: s.count_by_type
          }))
        },
        activeSubscriptions: alertService.getActiveSubscriptions()
      });

    } catch (error: any) {
      logger.error('Error in getAlertStats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async testAlert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Send a test alert to verify SSE connection
      const testAlert = {
        id: uuidv4(),
        userId,
        type: 'test' as any,
        message: 'Test alert - your real-time notifications are working!',
        value: 0,
        threshold: 0,
        priority: 'low' as any,
        timestamp: new Date()
      };

      // Store test alert
      await DatabaseService.run(
        `INSERT INTO alerts 
         (id, user_id, type, symbol, condition_text, value, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [testAlert.id, userId, 'test', null, testAlert.message, 0]
      );

      res.json({
        success: true,
        message: 'Test alert sent'
      });

    } catch (error: any) {
      logger.error('Error in testAlert:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}