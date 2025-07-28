import { Response } from 'express';
import { DatabaseService } from '../database/DatabaseService';
import { AuthenticatedRequest } from '../types/auth';

export class SocialController {
  /**
   * Get anonymized community trading metrics
   */
  static async getCommunityMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const { timeframe = '7d', category: _category = 'all' } = req.query;
      
      // Get timeframe filter
      let timeFilter = '';
      const now = new Date();
      const timeFrameHours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : 168;
      const startTime = new Date(now.getTime() - (timeFrameHours * 60 * 60 * 1000));
      timeFilter = `AND created_at >= '${startTime.toISOString()}'`;

      // Get top performers (anonymized)
      const topPerformers = await DatabaseService.all(`
        SELECT 
          'trader_' || SUBSTR(user_id, 1, 8) as anonymous_id,
          win_rate,
          total_trades,
          profit_factor,
          'rank_' || ROW_NUMBER() OVER (ORDER BY win_rate DESC) as rank,
          CASE 
            WHEN total_profit > 0 THEN 'profitable'
            ELSE 'unprofitable'
          END as status
        FROM social_metrics 
        WHERE is_public = 1 ${timeFilter}
          AND total_trades >= 10
        ORDER BY win_rate DESC, profit_factor DESC
        LIMIT 20
      `);

      // Get trading volume distribution
      const volumeDistribution = await DatabaseService.all(`
        SELECT 
          CASE 
            WHEN total_volume < 10000 THEN 'micro'
            WHEN total_volume < 100000 THEN 'small'
            WHEN total_volume < 1000000 THEN 'medium'
            ELSE 'large'
          END as volume_category,
          COUNT(*) as trader_count,
          AVG(win_rate) as avg_win_rate,
          AVG(profit_factor) as avg_profit_factor
        FROM social_metrics 
        WHERE is_public = 1 ${timeFilter}
        GROUP BY volume_category
      `);

      // Get popular symbols and strategies
      const popularSymbols = await DatabaseService.all(`
        SELECT 
          symbol,
          COUNT(*) as trade_count,
          AVG(CASE WHEN profit > 0 THEN 1.0 ELSE 0.0 END) as success_rate,
          AVG(profit) as avg_profit
        FROM trades t
        JOIN users u ON t.user_id = u.id
        JOIN social_metrics sm ON u.id = sm.user_id
        WHERE sm.is_public = 1 ${timeFilter.replace('created_at', 't.created_at')}
        GROUP BY symbol
        HAVING trade_count >= 5
        ORDER BY trade_count DESC, success_rate DESC
        LIMIT 10
      `);

      // Get risk distribution
      const riskDistribution = await DatabaseService.all(`
        SELECT 
          CASE 
            WHEN avg_risk_score < 3 THEN 'Conservative'
            WHEN avg_risk_score < 7 THEN 'Moderate'
            ELSE 'Aggressive'
          END as risk_category,
          COUNT(*) as trader_count,
          AVG(win_rate) as avg_win_rate,
          AVG(total_trades) as avg_trades
        FROM social_metrics 
        WHERE is_public = 1 ${timeFilter}
        GROUP BY risk_category
      `);

      // Get community sentiment
      const sentiment = await DatabaseService.get(`
        SELECT 
          AVG(CASE WHEN total_profit > 0 THEN 1.0 ELSE 0.0 END) * 100 as bullish_percentage,
          AVG(win_rate) as community_win_rate,
          COUNT(*) as total_active_traders,
          SUM(total_trades) as total_community_trades
        FROM social_metrics 
        WHERE is_public = 1 ${timeFilter}
          AND last_active >= '${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}'
      `) as {
        bullish_percentage: number;
        community_win_rate: number;
        total_active_traders: number;
        total_community_trades: number;
      } | null;

      res.json({
        success: true,
        data: {
          topPerformers,
          volumeDistribution,
          popularSymbols,
          riskDistribution,
          sentiment: {
            bullishPercentage: parseFloat(String(sentiment?.bullish_percentage || 0)),
            communityWinRate: parseFloat(String(sentiment?.community_win_rate || 0)),
            totalActiveTraders: parseInt(String(sentiment?.total_active_traders || 0)),
            totalCommunityTrades: parseInt(String(sentiment?.total_community_trades || 0))
          },
          timeframe,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching community metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch community metrics'
      });
    }
  }

  /**
   * Update user's social sharing preferences
   */
  static async updateSharingPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { shareMetrics, shareWinRate, shareVolume, shareRiskScore } = req.body;

      // Update social_metrics table
      await DatabaseService.run(`
        INSERT OR REPLACE INTO social_metrics (
          user_id, is_public, share_win_rate, share_volume, share_risk_score, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, shareMetrics ? 1 : 0, shareWinRate ? 1 : 0, shareVolume ? 1 : 0, shareRiskScore ? 1 : 0, new Date().toISOString()]);

      res.json({
        success: true,
        message: 'Sharing preferences updated successfully'
      });

    } catch (error) {
      console.error('Error updating sharing preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update sharing preferences'
      });
    }
  }

  /**
   * Get user's current sharing preferences
   */
  static async getSharingPreferences(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const preferences = await DatabaseService.get(`
        SELECT 
          is_public as shareMetrics,
          share_win_rate as shareWinRate,
          share_volume as shareVolume,
          share_risk_score as shareRiskScore
        FROM social_metrics 
        WHERE user_id = ?
      `, [userId]);

      res.json({
        success: true,
        data: preferences || {
          shareMetrics: false,
          shareWinRate: false,
          shareVolume: false,
          shareRiskScore: false
        }
      });

    } catch (error) {
      console.error('Error fetching sharing preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sharing preferences'
      });
    }
  }

  /**
   * Submit feedback on platform or community features
   */
  static async submitFeedback(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { type, category, rating, message } = req.body;

      if (!type || !category || !rating || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: type, category, rating, message'
        });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }

      await DatabaseService.run(`
        INSERT INTO feedback (
          user_id, type, category, rating, message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, type, category, rating, message, new Date().toISOString()]);

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback'
      });
    }
  }

  /**
   * Get user badges and achievements
   */
  static async getUserBadges(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Get user's trading statistics
      const stats = await DatabaseService.get(`
        SELECT 
          COUNT(*) as total_trades,
          AVG(CASE WHEN profit > 0 THEN 1.0 ELSE 0.0 END) as win_rate,
          SUM(profit) as total_profit,
          MAX(profit) as best_trade,
          MIN(profit) as worst_trade,
          COUNT(DISTINCT symbol) as symbols_traded,
          JULIANDAY('now') - JULIANDAY(MIN(created_at)) as days_trading
        FROM trades 
        WHERE user_id = ?
      `, [userId]) as {
        total_trades: number;
        win_rate: number;
        total_profit: number;
        best_trade: number;
        worst_trade: number;
        symbols_traded: number;
        days_trading: number;
      } | null;

      // Calculate badges based on achievements
      const badges = [];

      if (stats) {
        const { total_trades, win_rate, total_profit, symbols_traded, days_trading } = stats;

        // Trading volume badges
        if (total_trades >= 1000) {
          badges.push({ id: 'volume_expert', name: 'Volume Expert', description: '1000+ trades executed', tier: 'gold' });
        } else if (total_trades >= 500) {
          badges.push({ id: 'volume_pro', name: 'Volume Pro', description: '500+ trades executed', tier: 'silver' });
        } else if (total_trades >= 100) {
          badges.push({ id: 'volume_trader', name: 'Active Trader', description: '100+ trades executed', tier: 'bronze' });
        }

        // Profitability badges
        if (total_profit > 50000) {
          badges.push({ id: 'profit_master', name: 'Profit Master', description: '$50,000+ profit', tier: 'gold' });
        } else if (total_profit > 10000) {
          badges.push({ id: 'profit_maker', name: 'Profit Maker', description: '$10,000+ profit', tier: 'silver' });
        } else if (total_profit > 1000) {
          badges.push({ id: 'profit_starter', name: 'Profit Starter', description: '$1,000+ profit', tier: 'bronze' });
        }

        // Win rate badges
        if (win_rate >= 0.8 && total_trades >= 50) {
          badges.push({ id: 'accuracy_master', name: 'Accuracy Master', description: '80%+ win rate', tier: 'gold' });
        } else if (win_rate >= 0.7 && total_trades >= 25) {
          badges.push({ id: 'accuracy_pro', name: 'Accurate Trader', description: '70%+ win rate', tier: 'silver' });
        } else if (win_rate >= 0.6 && total_trades >= 10) {
          badges.push({ id: 'accuracy_good', name: 'Consistent Trader', description: '60%+ win rate', tier: 'bronze' });
        }

        // Diversification badges
        if (symbols_traded >= 20) {
          badges.push({ id: 'diversification_expert', name: 'Diversification Expert', description: '20+ symbols traded', tier: 'gold' });
        } else if (symbols_traded >= 10) {
          badges.push({ id: 'diversification_pro', name: 'Multi-Asset Trader', description: '10+ symbols traded', tier: 'silver' });
        } else if (symbols_traded >= 5) {
          badges.push({ id: 'diversification_starter', name: 'Portfolio Builder', description: '5+ symbols traded', tier: 'bronze' });
        }

        // Longevity badges
        if (days_trading >= 365) {
          badges.push({ id: 'veteran_trader', name: 'Veteran Trader', description: '1+ year trading', tier: 'gold' });
        } else if (days_trading >= 180) {
          badges.push({ id: 'experienced_trader', name: 'Experienced Trader', description: '6+ months trading', tier: 'silver' });
        } else if (days_trading >= 30) {
          badges.push({ id: 'dedicated_trader', name: 'Dedicated Trader', description: '1+ month trading', tier: 'bronze' });
        }
      }

      res.json({
        success: true,
        data: {
          badges,
          stats: {
            totalTrades: parseInt(String(stats?.total_trades || 0)),
            winRate: parseFloat(String(stats?.win_rate || 0)) * 100,
            totalProfit: parseFloat(String(stats?.total_profit || 0)),
            symbolsTraded: parseInt(String(stats?.symbols_traded || 0)),
            daysTrading: Math.floor(parseFloat(String(stats?.days_trading || 0)))
          }
        }
      });

    } catch (error) {
      console.error('Error fetching user badges:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user badges'
      });
    }
  }

  /**
   * Get leaderboard for different categories
   */
  static async getLeaderboard(req: AuthenticatedRequest, res: Response) {
    try {
      const { category = 'win_rate', timeframe = '30d' } = req.query;
      
      // Calculate timeframe
      const now = new Date();
      const timeFrameHours = timeframe === '7d' ? 168 : timeframe === '30d' ? 720 : timeframe === '90d' ? 2160 : 720;
      const startTime = new Date(now.getTime() - (timeFrameHours * 60 * 60 * 1000));

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
          'trader_' || SUBSTR(sm.user_id, 1, 8) as anonymous_id,
          sm.win_rate,
          sm.total_trades,
          sm.total_profit,
          sm.profit_factor,
          sm.avg_risk_score,
          ROW_NUMBER() OVER (ORDER BY ${orderBy}) as rank,
          CASE 
            WHEN sm.user_id = ? THEN true
            ELSE false
          END as is_current_user
        FROM social_metrics sm
        WHERE sm.is_public = 1 
          AND sm.total_trades >= ?
          AND sm.updated_at >= ?
        ORDER BY ${orderBy}
        LIMIT 50
      `, [req.user!.id, minTrades, startTime.toISOString()]);

      res.json({
        success: true,
        data: {
          leaderboard,
          category,
          timeframe,
          updatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  }
}