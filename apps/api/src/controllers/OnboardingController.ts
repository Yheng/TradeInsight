import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';
import { v4 as uuidv4 } from 'uuid';

export class OnboardingController {
  static async logOnboardingStep(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { step, completionTime } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      if (!step) {
        return res.status(400).json({ success: false, error: 'Step is required' });
      }

      await DatabaseService.run(
        'INSERT INTO onboarding_logs (id, user_id, step, completion_time, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [uuidv4(), userId, step, completionTime || null]
      );

      res.json({
        success: true,
        message: 'Onboarding step logged successfully'
      });

    } catch (error: any) {
      logger.error('Error in logOnboardingStep:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async completeOnboarding(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { totalTime, steps } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      // Log completion
      const completionId = uuidv4();
      await DatabaseService.run(
        'INSERT INTO onboarding_logs (id, user_id, step, completion_time, completed_at, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [completionId, userId, 'onboarding_completed', totalTime || null]
      );

      // Log individual steps if provided
      if (steps && Array.isArray(steps)) {
        for (const stepData of steps) {
          await DatabaseService.run(
            'INSERT INTO onboarding_logs (id, user_id, step, completion_time, completed_at, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [uuidv4(), userId, stepData.step, stepData.completionTime || null]
          );
        }
      }

      // Log audit event
      await DatabaseService.run(
        'INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [uuidv4(), userId, 'ONBOARDING_COMPLETE', `Completed onboarding in ${totalTime || 'unknown'} seconds`]
      );

      res.json({
        success: true,
        message: 'Onboarding completed successfully'
      });

    } catch (error: any) {
      logger.error('Error in completeOnboarding:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }

  static async getOnboardingStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const onboardingData = await DatabaseService.all(
        'SELECT step, completion_time, completed_at FROM onboarding_logs WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );

      const isCompleted = onboardingData.some(log => log.step === 'onboarding_completed');
      const completedSteps = onboardingData.filter(log => log.step !== 'onboarding_completed').map(log => log.step);

      res.json({
        success: true,
        data: {
          isCompleted,
          completedSteps,
          logs: onboardingData
        }
      });

    } catch (error: any) {
      logger.error('Error in getOnboardingStatus:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}