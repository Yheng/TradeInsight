import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from '@tradeinsight/utils';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { DatabaseService } from './database/DatabaseService';
import { AIAnalysisService } from './services/AIAnalysisService';
import { alertService } from './services/AlertService';
import { SocialService } from './services/SocialService';
import { backupService } from './services/BackupService';
import { monitoringService } from './services/MonitoringService';
import { monitoringMiddleware, healthCheckMiddleware } from './middleware/monitoring';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import tradesRoutes from './routes/trades';
import marketDataRoutes from './routes/marketData';
import analyticsRoutes from './routes/analytics';
import alertsRoutes from './routes/alerts';
import mt5Routes from './routes/mt5';
import aiRoutes from './routes/ai';
import adminRoutes from './routes/admin';
import socialRoutes from './routes/social';
import backupRoutes from './routes/backup';
import monitoringRoutes from './routes/monitoring';
import onboardingRoutes from './routes/onboarding';
import brokerRoutes from './routes/broker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Monitoring middleware
app.use(monitoringMiddleware);
app.use(healthCheckMiddleware);

// Initialize database
DatabaseService.initialize().catch(error => {
  logger.error('Failed to initialize database:', error);
  process.exit(1);
});

// Initialize AI Analysis Service
AIAnalysisService.initialize().catch(error => {
  logger.warn('Failed to initialize AI analysis service:', error);
  logger.info('AI features will use rule-based analysis only');
});

// Start real-time alert monitoring
alertService.startMonitoring().catch(error => {
  logger.error('Failed to start alert monitoring:', error);
});

// Start social metrics updates
SocialService.startPeriodicUpdates();

// Initialize backup service and schedule automatic backups
backupService.initialize().then(() => {
  backupService.scheduleAutomaticBackups();
}).catch(error => {
  logger.error('Failed to initialize backup service:', error);
});

// Start monitoring service
monitoringService.start().catch(error => {
  logger.error('Failed to start monitoring service:', error);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'tradeinsight-api'
  });
});

// Test endpoint for market data without authentication
app.get('/api/test/market/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  const { timeframe = '1H', count = 100 } = req.query;
  
  // Generate sample historical data
  function generateSampleHistoricalData(symbol: string, count: number) {
    const data = [];
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
    
    const basePrice = basePrices[symbol] || 1.0000;
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
  
  const sampleData = generateSampleHistoricalData(symbol, parseInt(count as string) || 100);
  
  res.json({
    success: true,
    data: sampleData,
    message: 'Test data for development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/trades', authMiddleware, tradesRoutes);
app.use('/api/market', authMiddleware, marketDataRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/alerts', authMiddleware, alertsRoutes);
app.use('/api/mt5', authMiddleware, mt5Routes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/social', authMiddleware, socialRoutes);
app.use('/api/backup', authMiddleware, backupRoutes);
app.use('/api/monitoring', authMiddleware, monitoringRoutes);
app.use('/api/onboarding', authMiddleware, onboardingRoutes);
app.use('/api/broker', authMiddleware, brokerRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  logger.info(`TradeInsight API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;