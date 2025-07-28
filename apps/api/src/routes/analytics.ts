import express from 'express';
import axios from 'axios';
const { v4: uuidv4 } = require('uuid');
import { AIAnalysis } from '@tradeinsight/types';
import { DatabaseService } from '../database/DatabaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get AI analysis for a symbol
router.get('/ai/:symbol', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { symbol } = req.params;

  // Check for recent analysis (within last hour)
  const recentAnalysis = await DatabaseService.get<AIAnalysis>(
    'SELECT * FROM ai_analyses WHERE symbol = ? AND created_at > datetime("now", "-1 hour") ORDER BY created_at DESC LIMIT 1',
    [symbol]
  );

  if (recentAnalysis) {
    return res.json({
      success: true,
      data: recentAnalysis,
      cached: true
    });
  }

  // Generate new analysis
  try {
    const marketDataResponse = await axios.get(`http://localhost:3000/api/market/symbols/${symbol}`, {
      headers: { Authorization: req.headers.authorization }
    });

    const marketData = marketDataResponse.data.data;
    
    // Simple rule-based analysis (can be enhanced with ML)
    const spread = marketData.ask - marketData.bid;
    const relativeSpread = (spread / marketData.bid) * 100;
    
    let recommendation: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0.5;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    let reasoning = 'Market analysis based on current spread and volatility';

    // Basic analysis logic
    if (relativeSpread < 0.01) {
      recommendation = 'BUY';
      confidence = 0.7;
      riskLevel = 'LOW';
      reasoning = 'Low spread indicates good market conditions for entry';
    } else if (relativeSpread > 0.05) {
      recommendation = 'HOLD';
      confidence = 0.8;
      riskLevel = 'HIGH';
      reasoning = 'High spread indicates volatile market conditions, wait for better entry';
    }

    const analysis: AIAnalysis = {
      symbol,
      recommendation,
      confidence,
      reasoning,
      riskLevel,
      timeframe: '1H',
      createdAt: new Date()
    };

    // Store analysis
    const analysisId = uuidv4();
    await DatabaseService.run(
      'INSERT INTO ai_analyses (id, symbol, recommendation, confidence, reasoning, risk_level, timeframe) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [analysisId, symbol, recommendation, confidence, reasoning, riskLevel, analysis.timeframe]
    );

    res.json({
      success: true,
      data: analysis,
      cached: false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI analysis'
    });
  }
}));

// Get risk analysis for user
router.get('/risk', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const userId = req.user!.id;

  // Get user's trades for risk calculation
  const trades = await DatabaseService.all<any>(
    'SELECT * FROM trades WHERE user_id = ? AND status = "closed"',
    [userId]
  );

  if (trades.length === 0) {
    return res.json({
      success: true,
      data: {
        message: 'No closed trades found for risk analysis'
      }
    });
  }

  // Calculate risk metrics
  const profits = trades.map(t => t.profit || 0);
  const wins = profits.filter(p => p > 0);
  const losses = profits.filter(p => p < 0);

  const totalProfit = profits.reduce((sum, p) => sum + p, 0);
  const winRate = (wins.length / trades.length) * 100;
  const averageWin = wins.length > 0 ? wins.reduce((sum, w) => sum + w, 0) / wins.length : 0;
  const averageLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, l) => sum + l, 0) / losses.length) : 0;
  const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;

  // Calculate maximum drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningTotal = 0;

  for (const profit of profits) {
    runningTotal += profit;
    if (runningTotal > peak) {
      peak = runningTotal;
    }
    const drawdown = peak - runningTotal;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Simple Sharpe ratio approximation
  const returns = profits;
  const averageReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - averageReturn, 2), 0) / returns.length;
  const sharpeRatio = variance > 0 ? averageReturn / Math.sqrt(variance) : 0;

  // Risk score (0-100, lower is better)
  let riskScore = 50; // Base score
  if (winRate < 40) riskScore += 20;
  if (maxDrawdown > 1000) riskScore += 15;
  if (profitFactor < 1) riskScore += 15;
  if (sharpeRatio < 0) riskScore += 10;
  riskScore = Math.min(100, Math.max(0, riskScore));

  const riskMetrics = {
    userId,
    totalExposure: Math.abs(totalProfit),
    maxDrawdown,
    sharpeRatio: Number(sharpeRatio.toFixed(4)),
    winRate: Number(winRate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(4)),
    averageWin: Number(averageWin.toFixed(2)),
    averageLoss: Number(averageLoss.toFixed(2)),
    riskScore: Number(riskScore.toFixed(0)),
    lastUpdated: new Date()
  };

  // Store/update risk metrics
  await DatabaseService.run(
    `INSERT OR REPLACE INTO risk_metrics 
     (id, user_id, total_exposure, max_drawdown, sharpe_ratio, win_rate, profit_factor, average_win, average_loss, risk_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uuidv4(), userId, riskMetrics.totalExposure, riskMetrics.maxDrawdown, riskMetrics.sharpeRatio, 
     riskMetrics.winRate, riskMetrics.profitFactor, riskMetrics.averageWin, riskMetrics.averageLoss, riskMetrics.riskScore]
  );

  res.json({
    success: true,
    data: riskMetrics
  });
}));

// Get portfolio performance
router.get('/performance', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const userId = req.user!.id;
  const { period = '30d' } = req.query;

  let dateFilter = '';
  switch (period) {
    case '7d':
      dateFilter = 'datetime("now", "-7 days")';
      break;
    case '30d':
      dateFilter = 'datetime("now", "-30 days")';
      break;
    case '90d':
      dateFilter = 'datetime("now", "-90 days")';
      break;
    default:
      dateFilter = 'datetime("now", "-30 days")';
  }

  const performanceData = await DatabaseService.all<any>(
    `SELECT 
      DATE(created_at) as date,
      SUM(profit) as daily_profit,
      COUNT(*) as trades_count
     FROM trades 
     WHERE user_id = ? AND status = 'closed' AND created_at > ${dateFilter}
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [userId]
  );

  res.json({
    success: true,
    data: performanceData
  });
}));

export default router;