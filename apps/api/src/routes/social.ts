import { Router } from 'express';
import { SocialController } from '../controllers/SocialController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Require authentication for all social routes
router.use(authMiddleware);

// Community metrics and insights
router.get('/community/metrics', SocialController.getCommunityMetrics);
router.get('/leaderboard', SocialController.getLeaderboard);

// User social features
router.get('/sharing/preferences', SocialController.getSharingPreferences);
router.put('/sharing/preferences', SocialController.updateSharingPreferences);
router.get('/badges', SocialController.getUserBadges);

// Feedback system
router.post('/feedback', SocialController.submitFeedback);

export default router;