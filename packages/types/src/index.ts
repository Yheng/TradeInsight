export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin'
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  type: TradeType;
  volume: number;
  openPrice: number;
  closePrice?: number;
  openTime: Date;
  closeTime?: Date;
  profit?: number;
  commission: number;
  swap: number;
  comment?: string;
  status: TradeStatus;
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell'
}

export enum TradeStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  PENDING = 'pending'
}

export interface MarketData {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  time: Date;
  spread: number;
}

export interface AIAnalysis {
  symbol: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
  createdAt: Date;
}

export interface RiskMetrics {
  userId: string;
  totalExposure: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  riskScore: number;
  lastUpdated: Date;
}

export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  symbol?: string;
  condition: string;
  value: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export enum AlertType {
  PRICE = 'price',
  PROFIT_LOSS = 'profit_loss',
  RISK = 'risk',
  NEWS = 'news'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MT5ConnectionConfig {
  server: string;
  login: number;
  password: string;
  timeout: number;
}

export interface TradingSession {
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  tradesCount: number;
  totalProfit: number;
  isActive: boolean;
}