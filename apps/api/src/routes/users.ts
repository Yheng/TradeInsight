import express from 'express';
import { DatabaseService } from '../database/DatabaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const user = await DatabaseService.get<any>(
    'SELECT id, email, username, first_name, last_name, role, is_email_verified, created_at FROM users WHERE id = ?',
    [req.user!.id]
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
}));

export default router;