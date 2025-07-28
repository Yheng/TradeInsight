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