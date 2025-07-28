import express from 'express';
import { body, query, validationResult } from 'express-validator';
const { v4: uuidv4 } = require('uuid');
import { Trade, TradeType, TradeStatus } from '@tradeinsight/types';
import { DatabaseService } from '../database/DatabaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get user's trades with pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('symbol').optional().isString(),
  query('status').optional().isIn(['open', 'closed', 'pending'])
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;
  const symbol = req.query.symbol as string;
  const status = req.query.status as string;

  let whereClause = 'WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (symbol) {
    whereClause += ' AND symbol = ?';
    params.push(symbol);
  }

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  const trades = await DatabaseService.all<Trade>(
    `SELECT * FROM trades ${whereClause} ORDER BY open_time DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const totalCount = await DatabaseService.get<{ count: number }>(
    `SELECT COUNT(*) as count FROM trades ${whereClause}`,
    params
  );

  res.json({
    success: true,
    data: trades,
    pagination: {
      page,
      limit,
      total: totalCount?.count || 0,
      totalPages: Math.ceil((totalCount?.count || 0) / limit)
    }
  });
}));

// Get single trade
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const trade = await DatabaseService.get<Trade>(
    'SELECT * FROM trades WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );

  if (!trade) {
    return res.status(404).json({
      success: false,
      error: 'Trade not found'
    });
  }

  res.json({
    success: true,
    data: trade
  });
}));

// Create new trade
router.post('/', [
  body('symbol').isString().isLength({ min: 6, max: 6 }),
  body('type').isIn(['buy', 'sell']),
  body('volume').isFloat({ min: 0.01, max: 100 }),
  body('openPrice').isFloat({ min: 0 }),
  body('comment').optional().isString().isLength({ max: 500 })
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { symbol, type, volume, openPrice, comment } = req.body;
  const tradeId = uuidv4();

  await DatabaseService.run(
    `INSERT INTO trades (id, user_id, symbol, type, volume, open_price, open_time, comment, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tradeId, req.user!.id, symbol, type, volume, openPrice, new Date().toISOString(), comment || null, TradeStatus.OPEN]
  );

  const newTrade = await DatabaseService.get<Trade>(
    'SELECT * FROM trades WHERE id = ?',
    [tradeId]
  );

  res.status(201).json({
    success: true,
    data: newTrade
  });
}));

// Close trade
router.put('/:id/close', [
  body('closePrice').isFloat({ min: 0 })
], asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { closePrice } = req.body;
  const tradeId = req.params.id;

  // Get existing trade
  const trade = await DatabaseService.get<Trade>(
    'SELECT * FROM trades WHERE id = ? AND user_id = ? AND status = ?',
    [tradeId, req.user!.id, TradeStatus.OPEN]
  );

  if (!trade) {
    return res.status(404).json({
      success: false,
      error: 'Open trade not found'
    });
  }

  // Calculate profit
  const profit = trade.type === TradeType.BUY 
    ? (closePrice - trade.openPrice) * trade.volume
    : (trade.openPrice - closePrice) * trade.volume;

  await DatabaseService.run(
    `UPDATE trades SET close_price = ?, close_time = ?, profit = ?, status = ?
     WHERE id = ?`,
    [closePrice, new Date().toISOString(), profit, TradeStatus.CLOSED, tradeId]
  );

  const updatedTrade = await DatabaseService.get<Trade>(
    'SELECT * FROM trades WHERE id = ?',
    [tradeId]
  );

  res.json({
    success: true,
    data: updatedTrade
  });
}));

// Get trading statistics
router.get('/stats/summary', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const stats = await DatabaseService.get<any>(
    `SELECT 
      COUNT(*) as total_trades,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_trades,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_trades,
      COALESCE(SUM(CASE WHEN profit > 0 THEN profit END), 0) as total_profit,
      COALESCE(SUM(CASE WHEN profit < 0 THEN profit END), 0) as total_loss,
      COALESCE(SUM(profit), 0) as net_profit,
      COUNT(CASE WHEN profit > 0 THEN 1 END) as winning_trades,
      COUNT(CASE WHEN profit < 0 THEN 1 END) as losing_trades
     FROM trades 
     WHERE user_id = ?`,
    [req.user!.id]
  );

  const winRate = stats.closed_trades > 0 
    ? (stats.winning_trades / stats.closed_trades) * 100 
    : 0;

  res.json({
    success: true,
    data: {
      ...stats,
      win_rate: Math.round(winRate * 100) / 100
    }
  });
}));

export default router;