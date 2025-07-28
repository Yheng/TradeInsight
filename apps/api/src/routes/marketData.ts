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
      timeout: 5000
    });

    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    // Generate sample historical data when MT5 service is unavailable
    const sampleData = generateSampleHistoricalData(symbol as string, parseInt(count as string) || 100);
    
    res.json({
      success: true,
      data: sampleData,
      message: 'Using sample data - MT5 service unavailable'
    });
  }
}));

// Helper function to generate sample historical data
function generateSampleHistoricalData(symbol: string, count: number) {
  const data = [];
  const basePrice = getBasePriceForSymbol(symbol);
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly data
    
    // Generate realistic price movement
    const volatility = 0.001; // 0.1% volatility
    const trend = (Math.random() - 0.5) * volatility;
    const high = currentPrice * (1 + Math.random() * volatility);
    const low = currentPrice * (1 - Math.random() * volatility);
    const close = currentPrice * (1 + trend);
    
    data.push({
      time: time.toISOString(),
      open: currentPrice,
      high: Math.max(currentPrice, high, close),
      low: Math.min(currentPrice, low, close),
      close: close,
      volume: Math.floor(Math.random() * 1000000) + 500000
    });
    
    currentPrice = close;
  }
  
  return data;
}

function getBasePriceForSymbol(symbol: string): number {
  const basePrices: { [key: string]: number } = {
    'EURUSD': 1.0950,
    'GBPUSD': 1.2750,
    'USDJPY': 149.50,
    'USDCHF': 0.8850,
    'AUDUSD': 0.6650,
    'USDCAD': 1.3580,
    'NZDUSD': 0.6150,
    'EURJPY': 163.75,
    'GBPJPY': 190.75,
    'EURGBP': 0.8580,
    'AUDCAD': 0.9025,
    'AUDNZD': 1.0810
  };
  
  return basePrices[symbol] || 1.0000;
}

// Test endpoint for debugging (no auth required)
router.get('/test/sample-data/:symbol', asyncHandler(async (req: any, res: any) => {
  const { symbol } = req.params;
  const count = 50;
  
  const sampleData = generateSampleHistoricalData(symbol, count);
  
  res.json({
    success: true,
    data: sampleData,
    message: 'Sample data for testing'
  });
}));

export default router;