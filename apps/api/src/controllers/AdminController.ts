import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';

export class AdminController {
  static async getUsersList(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      const { page = 1, limit = 25, sort = 'created_at', order = 'desc', filter } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = `
        SELECT 
          u.id, u.email, u.username, u.first_name, u.last_name, u.role, u.is_email_verified,
          u.created_at, u.updated_at,
          rm.win_rate, rm.max_drawdown, rm.risk_score,
          COUNT(t.id) as total_trades,
          SUM(CASE WHEN t.profit > 0 THEN 1 ELSE 0 END) as profitable_trades,
          SUM(t.profit) as total_profit
        FROM users u
        LEFT JOIN risk_metrics rm ON u.id = rm.user_id
        LEFT JOIN trades t ON u.id = t.user_id
      `;

      const params: any[] = [];

      if (filter) {
        query += ` WHERE (u.email LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const searchTerm = `%${filter}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      query += ` GROUP BY u.id`;

      // Validate sort column
      const allowedSortColumns = ['email', 'username', 'created_at', 'win_rate', 'total_trades', 'total_profit'];
      const sortColumn = allowedSortColumns.includes(sort as string) ? sort : 'created_at';
      const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

      query += ` ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`;
      params.push(parseInt(limit as string), offset);

      const users = await DatabaseService.all(query, params);

      // Get total count
      let countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u`;
      let countParams: any[] = [];

      if (filter) {
        countQuery += ` WHERE (u.email LIKE ? OR u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const searchTerm = `%${filter}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const countResult = await DatabaseService.get<{ total: number }>(countQuery, countParams);
      const totalUsers = countResult?.total || 0;

      res.json({
        success: true,
        users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / parseInt(limit as string))
        }
      });

    } catch (error: any) {
      logger.error('Error in getUsersList:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getUserDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const userRole = req.user?.role;
      const { userId } = req.params;

      if (!adminId || userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Get user details
      const user = await DatabaseService.get(
        `SELECT 
           u.id, u.email, u.username, u.first_name, u.last_name, u.role, u.is_email_verified,
           u.created_at, u.updated_at
         FROM users u 
         WHERE u.id = ?`,
        [userId]
      );

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Get risk metrics
      const riskMetrics = await DatabaseService.get(
        'SELECT * FROM risk_metrics WHERE user_id = ?',
        [userId]
      );

      // Get risk profile
      const riskProfile = await DatabaseService.get(
        'SELECT * FROM user_risk_profiles WHERE user_id = ?',
        [userId]
      );

      // Get MT5 credentials (without sensitive data)
      const mt5Credentials = await DatabaseService.get(
        'SELECT id, account_id, server, broker, is_active, created_at FROM user_mt5_credentials WHERE user_id = ? AND is_active = 1',
        [userId]
      );

      // Get recent trades
      const recentTrades = await DatabaseService.all(
        'SELECT * FROM trades WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [userId]
      );

      // Get alert history
      const alertHistory = await DatabaseService.all(
        'SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
        [userId]
      );

      res.json({
        success: true,
        user: {
          ...user,
          riskMetrics,
          riskProfile,
          mt5Credentials,
          recentTrades,
          alertHistory
        }
      });

    } catch (error: any) {
      logger.error('Error in getUserDetails:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async updateUserRiskSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const userRole = req.user?.role;
      const { userId } = req.params;
      const { maxLeverage, maxDrawdown, riskTolerance } = req.body;

      if (!adminId || userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Verify user exists
      const user = await DatabaseService.get('SELECT id FROM users WHERE id = ?', [userId]);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Update or create risk profile
      const existingProfile = await DatabaseService.get(
        'SELECT id FROM user_risk_profiles WHERE user_id = ?',
        [userId]
      );

      if (existingProfile) {
        await DatabaseService.run(
          `UPDATE user_risk_profiles 
           SET max_leverage = COALESCE(?, max_leverage),
               max_drawdown = COALESCE(?, max_drawdown),
               risk_tolerance = COALESCE(?, risk_tolerance),
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [maxLeverage, maxDrawdown, riskTolerance, userId]
        );
      } else {
        await DatabaseService.run(
          `INSERT INTO user_risk_profiles 
           (id, user_id, max_leverage, max_drawdown, risk_tolerance) 
           VALUES (?, ?, ?, ?, ?)`,
          [uuidv4(), userId, maxLeverage || 100, maxDrawdown || 10.0, riskTolerance || 'medium']
        );
      }

      // Log admin action
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), adminId, 'ADMIN_RISK_UPDATE', `Updated risk settings for user ${userId}`]
      );

      res.json({
        success: true,
        message: 'Risk settings updated successfully'
      });

    } catch (error: any) {
      logger.error('Error in updateUserRiskSettings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async bulkUpdateRiskSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const userRole = req.user?.role;
      const { userIds, riskSettings } = req.body;

      if (!adminId || userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ success: false, error: 'User IDs array is required' });
      }

      if (!riskSettings || typeof riskSettings !== 'object') {
        return res.status(400).json({ success: false, error: 'Risk settings object is required' });
      }

      const { maxLeverage, maxDrawdown, riskTolerance } = riskSettings;

      // Begin transaction
      let successCount = 0;
      let errorCount = 0;

      for (const userId of userIds) {
        try {
          // Verify user exists
          const user = await DatabaseService.get('SELECT id FROM users WHERE id = ?', [userId]);
          if (!user) {
            errorCount++;
            continue;
          }

          // Update or create risk profile
          const existingProfile = await DatabaseService.get(
            'SELECT id FROM user_risk_profiles WHERE user_id = ?',
            [userId]
          );

          if (existingProfile) {
            await DatabaseService.run(
              `UPDATE user_risk_profiles 
               SET max_leverage = COALESCE(?, max_leverage),
                   max_drawdown = COALESCE(?, max_drawdown),
                   risk_tolerance = COALESCE(?, risk_tolerance),
                   updated_at = CURRENT_TIMESTAMP
               WHERE user_id = ?`,
              [maxLeverage, maxDrawdown, riskTolerance, userId]
            );
          } else {
            await DatabaseService.run(
              `INSERT INTO user_risk_profiles 
               (id, user_id, max_leverage, max_drawdown, risk_tolerance) 
               VALUES (?, ?, ?, ?, ?)`,
              [uuidv4(), userId, maxLeverage || 100, maxDrawdown || 10.0, riskTolerance || 'medium']
            );
          }

          successCount++;

        } catch (error) {
          logger.error(`Error updating risk settings for user ${userId}:`, error);
          errorCount++;
        }
      }

      // Log admin action
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), adminId, 'ADMIN_BULK_RISK_UPDATE', `Bulk updated risk settings for ${successCount} users`]
      );

      res.json({
        success: true,
        message: `Bulk update completed: ${successCount} successful, ${errorCount} failed`,
        results: {
          successful: successCount,
          failed: errorCount,
          total: userIds.length
        }
      });

    } catch (error: any) {
      logger.error('Error in bulkUpdateRiskSettings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getAnalytics(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const userRole = req.user?.role;

      if (!adminId || userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Get overall statistics
      const userStats = await DatabaseService.get<{
        total_users: number;
        active_users: number;
        verified_users: number;
      }>(
        `SELECT 
           COUNT(*) as total_users,
           COUNT(CASE WHEN updated_at > datetime('now', '-30 days') THEN 1 END) as active_users,
           COUNT(CASE WHEN is_email_verified = 1 THEN 1 END) as verified_users
         FROM users`
      );

      const tradeStats = await DatabaseService.get<{
        total_trades: number;
        profitable_trades: number;
        total_volume: number;
        total_profit: number;
      }>(
        `SELECT 
           COUNT(*) as total_trades,
           COUNT(CASE WHEN profit > 0 THEN 1 END) as profitable_trades,
           SUM(volume) as total_volume,
           SUM(profit) as total_profit
         FROM trades`
      );

      const alertStats = await DatabaseService.get<{
        total_alerts: number;
        active_alerts: number;
        triggered_alerts: number;
      }>(
        `SELECT 
           COUNT(*) as total_alerts,
           COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_alerts,
           COUNT(CASE WHEN is_triggered = 1 THEN 1 END) as triggered_alerts
         FROM alerts`
      );

      // Get top performing users
      const topPerformers = await DatabaseService.all(
        `SELECT 
           u.id, u.email, u.username,
           rm.win_rate, rm.profit_factor, rm.risk_score,
           SUM(t.profit) as total_profit,
           COUNT(t.id) as total_trades
         FROM users u
         LEFT JOIN risk_metrics rm ON u.id = rm.user_id
         LEFT JOIN trades t ON u.id = t.user_id
         GROUP BY u.id
         HAVING total_trades > 0
         ORDER BY total_profit DESC
         LIMIT 10`
      );

      // Get recent activity
      const recentActivity = await DatabaseService.all(
        `SELECT 
           al.action, al.details, al.timestamp,
           u.email as admin_email
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         WHERE al.action LIKE 'ADMIN_%'
         ORDER BY al.timestamp DESC
         LIMIT 20`
      );

      // Get onboarding metrics
      const onboardingStats = await DatabaseService.get<{
        total_sessions: number;
        completed_sessions: number;
        avg_completion_time: number;
      }>(
        `SELECT 
           COUNT(*) as total_sessions,
           COUNT(CASE WHEN completion_time IS NOT NULL THEN 1 END) as completed_sessions,
           AVG(completion_time) as avg_completion_time
         FROM onboarding_logs`
      );

      res.json({
        success: true,
        analytics: {
          users: userStats || { total_users: 0, active_users: 0, verified_users: 0 },
          trades: tradeStats || { total_trades: 0, profitable_trades: 0, total_volume: 0, total_profit: 0 },
          alerts: alertStats || { total_alerts: 0, active_alerts: 0, triggered_alerts: 0 },
          onboarding: onboardingStats || { total_sessions: 0, completed_sessions: 0, avg_completion_time: 0 },
          topPerformers,
          recentActivity
        }
      });

    } catch (error: any) {
      logger.error('Error in getAnalytics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async exportUserData(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const userRole = req.user?.role;
      const { format = 'csv', userId } = req.query;

      if (!adminId || userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      let query = `
        SELECT 
          u.id, u.email, u.username, u.first_name, u.last_name, u.role, u.is_email_verified,
          u.created_at, u.updated_at,
          rm.win_rate, rm.max_drawdown, rm.risk_score, rm.profit_factor,
          COUNT(t.id) as total_trades,
          SUM(CASE WHEN t.profit > 0 THEN 1 ELSE 0 END) as profitable_trades,
          SUM(t.profit) as total_profit,
          rp.max_leverage, rp.risk_tolerance
        FROM users u
        LEFT JOIN risk_metrics rm ON u.id = rm.user_id
        LEFT JOIN trades t ON u.id = t.user_id
        LEFT JOIN user_risk_profiles rp ON u.id = rp.user_id
      `;

      const params: any[] = [];

      if (userId) {
        query += ` WHERE u.id = ?`;
        params.push(userId);
      }

      query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

      const userData = await DatabaseService.all(query, params);

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'ID', 'Email', 'Username', 'First Name', 'Last Name', 'Role', 'Verified',
          'Created At', 'Updated At', 'Win Rate', 'Max Drawdown', 'Risk Score',
          'Profit Factor', 'Total Trades', 'Profitable Trades', 'Total Profit',
          'Max Leverage', 'Risk Tolerance'
        ];

        let csvContent = headers.join(',') + '\n';

        userData.forEach((user: any) => {
          const row = [
            user.id, user.email, user.username, user.first_name, user.last_name,
            user.role, user.is_email_verified, user.created_at, user.updated_at,
            user.win_rate || 0, user.max_drawdown || 0, user.risk_score || 0,
            user.profit_factor || 0, user.total_trades || 0, user.profitable_trades || 0,
            user.total_profit || 0, user.max_leverage || 0, user.risk_tolerance || ''
          ];
          csvContent += row.map(field => `"${field}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="user_data_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON
        res.json({
          success: true,
          data: userData,
          exportedAt: new Date().toISOString(),
          count: userData.length
        });
      }

      // Log export action
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), adminId, 'ADMIN_DATA_EXPORT', `Exported ${userData.length} user records as ${format}`]
      );

    } catch (error: any) {
      logger.error('Error in exportUserData:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getSocialMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const adminId = req.user?.id;
      const userRole = req.user?.role;

      if (!adminId || userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }

      // Get social trading statistics
      const socialStats = await DatabaseService.get<{
        total_sharing_users: number;
        avg_win_rate: number;
        avg_drawdown: number;
        total_shared_metrics: number;
      }>(
        `SELECT 
           COUNT(CASE WHEN sharing_enabled = 1 THEN 1 END) as total_sharing_users,
           AVG(win_rate) as avg_win_rate,
           AVG(drawdown) as avg_drawdown,
           COUNT(*) as total_shared_metrics
         FROM social_metrics`
      );

      // Get anonymized insights for admin dashboard
      const insights = await DatabaseService.all(
        `SELECT 
           anonymized_id,
           win_rate,
           drawdown,
           profit_total,
           trades_count,
           updated_at
         FROM social_metrics 
         WHERE sharing_enabled = 1 
         ORDER BY profit_total DESC 
         LIMIT 10`
      );

      res.json({
        success: true,
        socialMetrics: {
          stats: socialStats || { total_sharing_users: 0, avg_win_rate: 0, avg_drawdown: 0, total_shared_metrics: 0 },
          topPerformers: insights
        }
      });

    } catch (error: any) {
      logger.error('Error in getSocialMetrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}