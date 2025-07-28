import express from 'express';
import axios from 'axios';
import { MarketData } from '@tradeinsight/types';
import { DatabaseService } from '../database/DatabaseService';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const MT5_SERVICE_URL = process.env.MT5_SERVICE_URL || 'http://localhost:5000';

// Get real-time market data for a symbol
router.get('/symbols/:symbol', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { symbol } = req.params;

  try {
    // Try to get live data from MT5 service
    const response = await axios.get(`${MT5_SERVICE_URL}/api/symbol-info/${symbol}`, {
      timeout: 5000
    });

    const marketData: MarketData = {
      symbol,
      bid: response.data.bid,
      ask: response.data.ask,
      last: response.data.last,
      volume: response.data.volume,
      time: new Date(response.data.time),
      spread: response.data.spread
    };

    // Store in database for caching
    await DatabaseService.run(
      'INSERT INTO market_data (symbol, bid, ask, last, volume, spread) VALUES (?, ?, ?, ?, ?, ?)',
      [symbol, marketData.bid, marketData.ask, marketData.last, marketData.volume, marketData.spread]
    );

    res.json({
      success: true,
      data: marketData
    });
  } catch (error) {
    // Fallback to cached data if MT5 service is unavailable
    const cachedData = await DatabaseService.get<any>(
      'SELECT * FROM market_data WHERE symbol = ? ORDER BY timestamp DESC LIMIT 1',
      [symbol]
    );

    if (cachedData) {
      res.json({
        success: true,
        data: {
          symbol: cachedData.symbol,
          bid: cachedData.bid,
          ask: cachedData.ask,
          last: cachedData.last,
          volume: cachedData.volume,
          spread: cachedData.spread,
          time: new Date(cachedData.timestamp)
        },
        message: 'Using cached data - MT5 service unavailable'
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'Market data unavailable and no cached data found'
      });
    }
  }
}));

// Get multiple symbols
router.post('/symbols', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { symbols } = req.body;

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Symbols array is required'
    });
  }

  const results: MarketData[] = [];

  for (const symbol of symbols) {
    try {
      const response = await axios.get(`${MT5_SERVICE_URL}/api/symbol-info/${symbol}`, {
        timeout: 3000
      });

      const marketData: MarketData = {
        symbol,
        bid: response.data.bid,
        ask: response.data.ask,
        last: response.data.last,
        volume: response.data.volume,
        time: new Date(response.data.time),
        spread: response.data.spread
      };

      results.push(marketData);
    } catch (error) {
      // Try cached data for this symbol
      const cachedData = await DatabaseService.get<any>(
        'SELECT * FROM market_data WHERE symbol = ? ORDER BY timestamp DESC LIMIT 1',
        [symbol]
      );

      if (cachedData) {
        results.push({
          symbol: cachedData.symbol,
          bid: cachedData.bid,
          ask: cachedData.ask,
          last: cachedData.last,
          volume: cachedData.volume,
          spread: cachedData.spread,
          time: new Date(cachedData.timestamp)
        });
      }
    }
  }

  res.json({
    success: true,
    data: results
  });
}));

// Get historical data
router.get('/symbols/:symbol/history', asyncHandler(async (req: AuthenticatedRequest, res: any) => {
  const { symbol } = req.params;
  const { timeframe = '1H', count = 100 } = req.query;

  try {
    const response = await axios.get(`${MT5_SERVICE_URL}/api/rates/${symbol}`, {
      params: { timeframe, count },
      timeout: 10000
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Historical data service unavailable'
    });
  }
}));

export default router;