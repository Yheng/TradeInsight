import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AIAnalysisService } from '../services/AIAnalysisService';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';

export class AIAnalysisController {
  static async generateAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Get user's trade data
      const trades = await DatabaseService.all(
        'SELECT * FROM trades WHERE user_id = ? ORDER BY mt5_time DESC LIMIT 100',
        [userId]
      );

      // Get user's risk profile
      const riskProfile = await DatabaseService.get<{
        max_leverage: number;
        risk_tolerance: string;
        max_drawdown: number;
        notification_settings: string;
      }>(
        'SELECT * FROM user_risk_profiles WHERE user_id = ?',
        [userId]
      );

      // Generate AI analysis
      const analysis = await AIAnalysisService.analyzeTrading({
        userId,
        trades,
        riskProfile: riskProfile ? {
          maxLeverage: riskProfile.max_leverage,
          riskTolerance: riskProfile.risk_tolerance,
          maxDrawdown: riskProfile.max_drawdown
        } : undefined
      });

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'AI_ANALYSIS', `Generated analysis for ${trades.length} trades`]
      );

      res.json({
        success: true,
        analysis,
        tradesAnalyzed: trades.length,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Error in generateAnalysis:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { symbol, limit = 10 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      let query = 'SELECT * FROM ai_analyses WHERE 1=1';
      const params: any[] = [];

      if (symbol) {
        query += ' AND symbol = ?';
        params.push(symbol as string);
      }

      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(parseInt(limit as string) || 10);

      const recommendations = await DatabaseService.all(query, params);

      res.json({
        success: true,
        recommendations,
        count: recommendations.length
      });

    } catch (error: any) {
      logger.error('Error in getRecommendations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async updateRiskProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { maxLeverage, riskTolerance, maxDrawdown, notificationSettings } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Validate input
      if (maxLeverage && (maxLeverage < 1 || maxLeverage > 500)) {
        return res.status(400).json({
          success: false,
          error: 'Max leverage must be between 1 and 500'
        });
      }

      if (maxDrawdown && (maxDrawdown < 1 || maxDrawdown > 50)) {
        return res.status(400).json({
          success: false,
          error: 'Max drawdown must be between 1% and 50%'
        });
      }

      if (riskTolerance && !['low', 'medium', 'high'].includes(riskTolerance)) {
        return res.status(400).json({
          success: false,
          error: 'Risk tolerance must be low, medium, or high'
        });
      }

      // Check if profile exists
      const existingProfile = await DatabaseService.get(
        'SELECT id FROM user_risk_profiles WHERE user_id = ?',
        [userId]
      );

      if (existingProfile) {
        // Update existing profile
        await DatabaseService.run(
          `UPDATE user_risk_profiles 
           SET max_leverage = COALESCE(?, max_leverage),
               risk_tolerance = COALESCE(?, risk_tolerance),
               max_drawdown = COALESCE(?, max_drawdown),
               notification_settings = COALESCE(?, notification_settings),
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [maxLeverage, riskTolerance, maxDrawdown, JSON.stringify(notificationSettings), userId]
        );
      } else {
        // Create new profile
        await DatabaseService.run(
          `INSERT INTO user_risk_profiles 
           (id, user_id, max_leverage, risk_tolerance, max_drawdown, notification_settings) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            userId,
            maxLeverage || 100,
            riskTolerance || 'medium',
            maxDrawdown || 10.0,
            JSON.stringify(notificationSettings || {})
          ]
        );
      }

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'RISK_PROFILE_UPDATE', 'Updated risk profile settings']
      );

      res.json({
        success: true,
        message: 'Risk profile updated successfully'
      });

    } catch (error: any) {
      logger.error('Error in updateRiskProfile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getRiskProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const riskProfile = await DatabaseService.get<{
        max_leverage: number;
        risk_tolerance: string;
        max_drawdown: number;
        notification_settings: string;
      }>(
        'SELECT * FROM user_risk_profiles WHERE user_id = ?',
        [userId]
      );

      if (!riskProfile) {
        // Return default risk profile
        return res.json({
          success: true,
          riskProfile: {
            maxLeverage: 100,
            riskTolerance: 'medium',
            maxDrawdown: 10.0,
            notificationSettings: {}
          },
          isDefault: true
        });
      }

      res.json({
        success: true,
        riskProfile: {
          maxLeverage: riskProfile.max_leverage,
          riskTolerance: riskProfile.risk_tolerance,
          maxDrawdown: riskProfile.max_drawdown,
          notificationSettings: JSON.parse(riskProfile.notification_settings || '{}')
        },
        isDefault: false
      });

    } catch (error: any) {
      logger.error('Error in getRiskProfile:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async submitFeedback(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { step, rating, comment } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Validate input
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }

      if (comment && comment.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Comment must be 100 characters or less'
        });
      }

      // Store feedback
      await DatabaseService.run(
        'INSERT INTO feedback (id, user_id, step, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userId, step, rating, comment]
      );

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });

    } catch (error: any) {
      logger.error('Error in submitFeedback:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getAnalysisHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { limit = 20 } = req.query;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Get analysis history from audit logs
      const analysisHistory = await DatabaseService.all(
        `SELECT * FROM audit_logs 
         WHERE user_id = ? AND action = 'AI_ANALYSIS' 
         ORDER BY timestamp DESC LIMIT ?`,
        [userId, parseInt(limit as string) || 20]
      );

      res.json({
        success: true,
        history: analysisHistory,
        count: analysisHistory.length
      });

    } catch (error: any) {
      logger.error('Error in getAnalysisHistory:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}