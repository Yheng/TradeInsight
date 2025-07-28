import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { requireRole } from '../middleware/auth';
import { UserRole } from '@tradeinsight/types';

const router = Router();

// Require admin role for all admin routes
router.use(requireRole([UserRole.ADMIN]));

// User management
router.get('/users', AdminController.getUsersList);
router.get('/users/:userId', AdminController.getUserDetails);
router.put('/users/:userId/risk', AdminController.updateUserRiskSettings);
router.post('/users/bulk-risk-update', AdminController.bulkUpdateRiskSettings);

// Analytics and reporting
router.get('/analytics', AdminController.getAnalytics);
router.get('/export/users', AdminController.exportUserData);

// Social trading insights
router.get('/social-metrics', AdminController.getSocialMetrics);

export default router;