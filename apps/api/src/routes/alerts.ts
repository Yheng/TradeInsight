import express from 'express';
import { body, validationResult } from 'express-validator';
const { v4: uuidv4 } = require('uuid');
import { Alert } from '@tradeinsight/types';
import { DatabaseService } from '../database/DatabaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AlertController } from '../controllers/AlertController';

const router = express.Router();

// Get user's alerts
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const alerts = await DatabaseService.all<Alert>(
    'SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC',
    [req.user!.id]
  );

  res.json({
    success: true,
    data: alerts
  });
}));

// Create new alert
router.post('/', [
  body('type').isIn(['price', 'profit_loss', 'risk', 'news']),
  body('symbol').optional().isString(),
  body('condition').isString(),
  body('value').isFloat()
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type, symbol, condition, value } = req.body;
  const alertId = uuidv4();

  await DatabaseService.run(
    'INSERT INTO alerts (id, user_id, type, symbol, condition_text, value, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [alertId, req.user!.id, type, symbol || null, condition, value, true]
  );

  const newAlert = await DatabaseService.get<Alert>(
    'SELECT * FROM alerts WHERE id = ?',
    [alertId]
  );

  res.status(201).json({
    success: true,
    data: newAlert
  });
}));

// Update alert
router.put('/:id', [
  body('isActive').optional().isBoolean()
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { isActive } = req.body;
  const alertId = req.params.id;

  const alert = await DatabaseService.get<Alert>(
    'SELECT * FROM alerts WHERE id = ? AND user_id = ?',
    [alertId, req.user!.id]
  );

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found'
    });
  }

  await DatabaseService.run(
    'UPDATE alerts SET is_active = ? WHERE id = ?',
    [isActive, alertId]
  );

  const updatedAlert = await DatabaseService.get<Alert>(
    'SELECT * FROM alerts WHERE id = ?',
    [alertId]
  );

  res.json({
    success: true,
    data: updatedAlert
  });
}));

// Delete alert
router.delete('/:id', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const alertId = req.params.id;

  const alert = await DatabaseService.get<Alert>(
    'SELECT * FROM alerts WHERE id = ? AND user_id = ?',
    [alertId, req.user!.id]
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

  res.json({
    success: true,
    message: 'Alert deleted successfully'
  });
}));

// Real-time alert endpoints
router.get('/subscribe', AlertController.subscribeToAlerts);
router.get('/stats', AlertController.getAlertStats);
router.post('/test', AlertController.testAlert);

export default router;