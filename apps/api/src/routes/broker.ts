import { Router } from 'express';
import { BrokerController } from '../controllers/BrokerController';
import { authMiddleware, requireRole } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for broker API endpoints (stricter limits)
const brokerApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each API key to 100 requests per 15 minutes
  message: {
    error: 'Too many API requests',
    code: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by API key instead of IP
    return req.headers['x-api-key'] as string || req.ip;
  }
});

// Apply rate limiting to all broker routes
router.use(brokerApiLimiter);

// Require admin authentication for all broker routes
router.use(authMiddleware);
router.use(requireRole(['admin']));

/**
 * @route GET /api/broker/users
 * @desc Get aggregated user data for CRM integration
 * @access Admin + API Key
 * @rateLimit 100 requests per 15 minutes
 * 
 * Query Parameters:
 * - limit: Number of users to return (max: 1000, default: 100)
 * - offset: Pagination offset (default: 0)
 * - sort: Sort field (created_at, win_rate, total_trades, total_profit, retention_score)
 * - order: Sort order (asc, desc, default: desc)
 * 
 * Headers Required:
 * - Authorization: Bearer <admin_jwt_token>
 * - x-api-key: <broker_api_key>
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "user_id": "uuid",
 *       "win_rate": 75.5,
 *       "drawdown": 12.3,
 *       "retention_score": 8.5,
 *       "total_trades": 150,
 *       "total_profit": 2500.75,
 *       "total_volume": 45.2,
 *       "risk_score": 6.8,
 *       "profit_factor": 1.8,
 *       "created_at": "2025-01-01T00:00:00.000Z",
 *       "last_active": "2025-01-15T12:00:00.000Z",
 *       "is_verified": true
 *     }
 *   ],
 *   "pagination": {
 *     "limit": 100,
 *     "offset": 0,
 *     "total": 1500,
 *     "has_more": true
 *   },
 *   "timestamp": "2025-01-15T12:00:00.000Z"
 * }
 */
router.get('/users', BrokerController.getUsers);

/**
 * @route GET /api/broker/analytics
 * @desc Get platform analytics for broker dashboards
 * @access Admin + API Key
 * @rateLimit 100 requests per 15 minutes
 * 
 * Query Parameters:
 * - timeframe: Analysis period (7d, 30d, 90d, default: 30d)
 * 
 * Headers Required:
 * - Authorization: Bearer <admin_jwt_token>
 * - x-api-key: <broker_api_key>
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "overview": {
 *       "total_users": 1500,
 *       "new_users": 150,
 *       "active_users": 800,
 *       "total_trades": 25000,
 *       "recent_trades": 5000,
 *       "avg_win_rate": 65.5,
 *       "avg_risk_score": 6.2,
 *       "recent_profit": 125000.50
 *     },
 *     "performance_distribution": [
 *       {
 *         "tier": "excellent",
 *         "user_count": 120,
 *         "avg_win_rate": 85.2,
 *         "avg_profit_factor": 2.8
 *       }
 *     ],
 *     "top_symbols": [
 *       {
 *         "symbol": "EURUSD",
 *         "trade_count": 8500,
 *         "success_rate": 68.5,
 *         "total_profit": 45000.25,
 *         "avg_volume": 0.85
 *       }
 *     ],
 *     "retention_metrics": {
 *       "weekly_active_users": 600,
 *       "monthly_active_users": 800,
 *       "avg_retention_score": 7.2
 *     }
 *   },
 *   "timeframe": "30d",
 *   "timestamp": "2025-01-15T12:00:00.000Z"
 * }
 */
router.get('/analytics', BrokerController.getAnalytics);

/**
 * @route GET /api/broker/risk
 * @desc Get risk management data for compliance monitoring
 * @access Admin + API Key
 * @rateLimit 100 requests per 15 minutes
 * 
 * Query Parameters:
 * - threshold: Risk level filter (low, medium, high, default: medium)
 * 
 * Headers Required:
 * - Authorization: Bearer <admin_jwt_token>
 * - x-api-key: <broker_api_key>
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "high_risk_users": [
 *       {
 *         "user_id": "uuid",
 *         "risk_score": 8.5,
 *         "max_drawdown": 25.0,
 *         "win_rate": 45.2,
 *         "profit_factor": 0.8,
 *         "max_leverage": 500,
 *         "risk_tolerance": "high",
 *         "active_alerts": 3,
 *         "total_trades": 200,
 *         "total_losses": 5000.0,
 *         "last_trade_date": "2025-01-15T10:00:00.000Z"
 *       }
 *     ],
 *     "risk_distribution": [
 *       {
 *         "risk_level": "high",
 *         "user_count": 85,
 *         "avg_risk_score": 8.2,
 *         "avg_drawdown": 22.5
 *       }
 *     ]
 *   },
 *   "threshold": "high",
 *   "timestamp": "2025-01-15T12:00:00.000Z"
 * }
 */
router.get('/risk', BrokerController.getRiskData);

/**
 * @route POST /api/broker/sync
 * @desc Sync user data to broker CRM systems
 * @access Admin + API Key
 * @rateLimit 100 requests per 15 minutes
 * 
 * Headers Required:
 * - Authorization: Bearer <admin_jwt_token>
 * - x-api-key: <broker_api_key>
 * - Content-Type: application/json
 * 
 * Request Body:
 * {
 *   "user_ids": ["uuid1", "uuid2", "uuid3"],
 *   "sync_type": "full" | "incremental"
 * }
 * 
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "users": [
 *       {
 *         "user_id": "uuid",
 *         "win_rate": 75.5,
 *         "drawdown": 12.3,
 *         "retention_score": 8.5,
 *         "total_trades": 150,
 *         "total_profit": 2500.75,
 *         "risk_score": 6.8,
 *         "profit_factor": 1.8,
 *         "last_trade_date": "2025-01-15T10:00:00.000Z",
 *         "last_updated": "2025-01-15T12:00:00.000Z"
 *       }
 *     ],
 *     "sync_type": "full",
 *     "synced_count": 3,
 *     "failed_count": 0
 *   },
 *   "timestamp": "2025-01-15T12:00:00.000Z"
 * }
 */
router.post('/sync', BrokerController.syncData);

export default router;