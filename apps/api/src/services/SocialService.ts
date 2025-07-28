import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';

export class SocialService {
  private static updateInterval: NodeJS.Timeout | null = null;

  /**
   * Start periodic social metrics updates
   */
  static startPeriodicUpdates() {
    // Update social metrics every 5 minutes
    this.updateInterval = setInterval(async () => {
      try {
        await this.updateAllUserMetrics();
        logger.info('Social metrics updated successfully');
      } catch (error) {
        logger.error('Error updating social metrics:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Initial update with delay to allow database initialization
    setTimeout(async () => {
      try {
        await this.updateAllUserMetrics();
        logger.info('Initial social metrics update completed');
      } catch (error) {
        logger.error('Error in initial social metrics update:', error);
      }
    }, 2000); // 2 second delay

    logger.info('Social service started - metrics will update every 5 minutes');
  }

  /**
   * Stop periodic updates
   */
  static stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('Social service stopped');
    }
  }

  /**
   * Update social metrics for all users who have opted in
   */
  static async updateAllUserMetrics() {
    try {
      // Check if social_metrics table exists
      const tableCheck = await DatabaseService.get(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='social_metrics'
      `) as { name: string } | null;

      if (!tableCheck) {
        logger.info('Social metrics table not yet created, skipping update');
        return;
      }

      // Get all users with existing social metrics records
      const users = await DatabaseService.all(`
        SELECT DISTINCT user_id 
        FROM social_metrics 
        WHERE is_public = 1
      `) as { user_id: string }[];

      for (const user of users) {
        await this.updateUserMetrics(user.user_id);
      }

      logger.info(`Updated social metrics for ${users.length} users`);

    } catch (error) {
      // Check if it's a table doesn't exist error
      if (error instanceof Error && error.message.includes('no such table')) {
        logger.info('Social metrics table not ready yet, skipping update');
        return;
      }
      
      logger.error('Error updating all user metrics:', error);
      throw error;
    }
  }

  /**
   * Update social metrics for a specific user
   */
  static async updateUserMetrics(userId: string) {
    try {
      // Calculate user's trading statistics
      const stats = await DatabaseService.get(`
        SELECT 
          COUNT(*) as total_trades,
          SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as winning_trades,
          SUM(profit) as total_profit,
          SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END) as total_wins,
          SUM(CASE WHEN profit < 0 THEN ABS(profit) ELSE 0 END) as total_losses,
          SUM(volume) as total_volume,
          AVG(profit) as avg_profit,
          MAX(profit) as best_trade,
          MIN(profit) as worst_trade,
          COUNT(DISTINCT symbol) as symbols_traded
        FROM trades 
        WHERE user_id = ?
          AND status = 'closed'
      `, [userId]) as {
        total_trades: number;
        winning_trades: number;
        total_profit: number;
        total_wins: number;
        total_losses: number;
        total_volume: number;
        avg_profit: number;
        best_trade: number;
        worst_trade: number;
        symbols_traded: number;
      } | null;

      if (!stats || stats.total_trades === 0) {
        return; // No trades to calculate metrics from
      }

      // Calculate derived metrics
      const winRate = (stats.winning_trades / stats.total_trades) * 100;
      const profitFactor = stats.total_losses > 0 ? stats.total_wins / stats.total_losses : stats.total_wins > 0 ? 999 : 0;
      
      // Get user's risk score from risk_profiles
      const riskProfile = await DatabaseService.get(`
        SELECT risk_score
        FROM user_risk_profiles 
        WHERE user_id = ?
      `, [userId]) as { risk_score: number } | null;

      const avgRiskScore = riskProfile?.risk_score || 5.0;

      // Update social_metrics table
      await DatabaseService.run(`
        UPDATE social_metrics 
        SET 
          total_trades = ?,
          win_rate = ?,
          total_profit = ?,
          total_volume = ?,
          profit_factor = ?,
          avg_risk_score = ?,
          best_trade = ?,
          worst_trade = ?,
          symbols_traded = ?,
          last_active = ?,
          updated_at = ?
        WHERE user_id = ?
      `, [
        stats.total_trades,
        winRate,
        stats.total_profit,
        stats.total_volume,
        profitFactor,
        avgRiskScore,
        stats.best_trade,
        stats.worst_trade,
        stats.symbols_traded,
        new Date().toISOString(),
        new Date().toISOString(),
        userId
      ]);

    } catch (error) {
      logger.error(`Error updating metrics for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Initialize social metrics for a new user
   */
  static async initializeUserMetrics(userId: string, sharePublicly: boolean = false) {
    try {
      await DatabaseService.run(`
        INSERT OR IGNORE INTO social_metrics (
          user_id, is_public, share_win_rate, share_volume, share_risk_score,
          total_trades, win_rate, total_profit, total_volume, profit_factor,
          avg_risk_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 5.0, ?, ?)
      `, [
        userId, 
        sharePublicly ? 1 : 0, 
        sharePublicly ? 1 : 0, 
        sharePublicly ? 1 : 0, 
        sharePublicly ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      logger.info(`Initialized social metrics for user ${userId}`);

    } catch (error) {
      logger.error(`Error initializing social metrics for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get anonymized leaderboard data
   */
  static async getLeaderboardData(category: string = 'win_rate', limit: number = 50) {
    try {
      let orderBy = 'win_rate DESC';
      let minTrades = 10;

      switch (category) {
        case 'profit':
          orderBy = 'total_profit DESC';
          minTrades = 5;
          break;
        case 'volume':
          orderBy = 'total_trades DESC';
          minTrades = 1;
          break;
        case 'consistency':
          orderBy = 'profit_factor DESC';
          minTrades = 20;
          break;
        default:
          orderBy = 'win_rate DESC';
      }

      const leaderboard = await DatabaseService.all(`
        SELECT 
          'trader_' || SUBSTR(user_id, 1, 8) as anonymous_id,
          win_rate,
          total_trades,
          total_profit,
          profit_factor,
          avg_risk_score,
          symbols_traded,
          ROW_NUMBER() OVER (ORDER BY ${orderBy}) as rank
        FROM social_metrics 
        WHERE is_public = 1 
          AND total_trades >= ?
        ORDER BY ${orderBy}
        LIMIT ?
      `, [minTrades, limit]);

      return leaderboard;

    } catch (error) {
      logger.error('Error fetching leaderboard data:', error);
      throw error;
    }
  }

  /**
   * Get community sentiment and aggregate statistics
   */
  static async getCommunityStats() {
    try {
      const stats = await DatabaseService.get(`
        SELECT 
          COUNT(*) as total_public_users,
          AVG(win_rate) as avg_win_rate,
          AVG(total_profit) as avg_profit,
          AVG(profit_factor) as avg_profit_factor,
          SUM(total_trades) as total_community_trades,
          AVG(CASE WHEN total_profit > 0 THEN 1.0 ELSE 0.0 END) * 100 as profitable_users_pct
        FROM social_metrics 
        WHERE is_public = 1 
          AND total_trades >= 5
          AND last_active >= datetime('now', '-7 days')
      `) as {
        total_public_users: number;
        avg_win_rate: number;
        avg_profit: number;
        avg_profit_factor: number;
        total_community_trades: number;
        profitable_users_pct: number;
      } | null;

      return {
        totalPublicUsers: parseInt(String(stats?.total_public_users || 0)),
        avgWinRate: parseFloat(String(stats?.avg_win_rate || 0)),
        avgProfit: parseFloat(String(stats?.avg_profit || 0)),
        avgProfitFactor: parseFloat(String(stats?.avg_profit_factor || 0)),
        totalCommunityTrades: parseInt(String(stats?.total_community_trades || 0)),
        profitableUsersPercentage: parseFloat(String(stats?.profitable_users_pct || 0)),
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error fetching community stats:', error);
      throw error;
    }
  }
}