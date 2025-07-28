import sqlite3 from 'sqlite3';
import { logger } from '@tradeinsight/utils';
import path from 'path';
import { DatabaseMigrations } from './migrations';

export class DatabaseService {
  private static db: sqlite3.Database;
  
  static async initialize(): Promise<void> {
    // Go up to the project root, then into data directory
    const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
    const dbPath = path.join(projectRoot, 'data', 'tradeinsight.db');
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Error opening database:', err);
          reject(err);
        } else {
          logger.info('Connected to SQLite database');
          this.createTables()
            .then(() => DatabaseMigrations.runMigrations())
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  private static async createTables(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_email_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        mt5_ticket INTEGER,
        mt5_order INTEGER,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL,
        entry TEXT,
        volume REAL NOT NULL,
        price REAL NOT NULL,
        profit REAL DEFAULT 0,
        commission REAL DEFAULT 0,
        swap REAL DEFAULT 0,
        comment TEXT,
        magic INTEGER DEFAULT 0,
        mt5_time INTEGER,
        status TEXT DEFAULT 'open',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS market_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        bid REAL NOT NULL,
        ask REAL NOT NULL,
        last REAL NOT NULL,
        volume REAL NOT NULL,
        spread REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        symbol TEXT,
        condition_text TEXT NOT NULL,
        value REAL NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        is_triggered BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        triggered_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS ai_analyses (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        confidence REAL NOT NULL,
        reasoning TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        target_price REAL,
        stop_loss REAL,
        timeframe TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS risk_metrics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        total_exposure REAL NOT NULL,
        max_drawdown REAL NOT NULL,
        sharpe_ratio REAL NOT NULL,
        win_rate REAL NOT NULL,
        profit_factor REAL NOT NULL,
        average_win REAL NOT NULL,
        average_loss REAL NOT NULL,
        risk_score REAL NOT NULL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_mt5_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        password_encrypted TEXT NOT NULL,
        server TEXT NOT NULL,
        broker TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_risk_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        max_leverage REAL DEFAULT 100,
        risk_tolerance TEXT DEFAULT 'medium',
        max_drawdown REAL DEFAULT 10.0,
        risk_score REAL DEFAULT 5.0,
        notification_settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS social_metrics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        is_public BOOLEAN DEFAULT 0,
        share_win_rate BOOLEAN DEFAULT 0,
        share_volume BOOLEAN DEFAULT 0,
        share_risk_score BOOLEAN DEFAULT 0,
        total_trades INTEGER DEFAULT 0,
        win_rate REAL DEFAULT 0,
        total_profit REAL DEFAULT 0,
        total_volume REAL DEFAULT 0,
        profit_factor REAL DEFAULT 0,
        avg_risk_score REAL DEFAULT 5.0,
        best_trade REAL DEFAULT 0,
        worst_trade REAL DEFAULT 0,
        symbols_traded INTEGER DEFAULT 0,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        rating INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS fetch_errors (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        error TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades (symbol)',
      'CREATE INDEX IF NOT EXISTS idx_trades_mt5_ticket ON trades (mt5_ticket)',
      'CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data (symbol)',
      'CREATE INDEX IF NOT EXISTS idx_market_data_timestamp ON market_data (timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_ai_analyses_symbol ON ai_analyses (symbol)',
      'CREATE INDEX IF NOT EXISTS idx_user_mt5_credentials_user_id ON user_mt5_credentials (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_risk_profiles_user_id ON user_risk_profiles (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_social_metrics_user_id ON social_metrics (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id)',
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp)'
    ];

    for (const index of indexes) {
      await this.run(index);
    }
    
    logger.info('Database tables and indexes created successfully');
  }

  static getDb(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  static async run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database run error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  static async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database get error:', err);
          reject(err);
        } else {
          resolve(row as T);
        }
      });
    });
  }

  static async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database all error:', err);
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  static async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database:', err);
            reject(err);
          } else {
            logger.info('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  static async verifyDatabase(dbPath?: string): Promise<boolean> {
    try {
      const sqlite3 = require('sqlite3').verbose();
      const testDb = new sqlite3.Database(dbPath || this.dbPath, sqlite3.OPEN_READONLY);
      
      return new Promise((resolve) => {
        testDb.get("PRAGMA integrity_check", (err: any, row: any) => {
          testDb.close();
          
          if (err) {
            logger.error('Database integrity check failed:', err.message);
            resolve(false);
          } else {
            const isValid = row.integrity_check === 'ok';
            if (!isValid) {
              logger.error('Database integrity check failed:', row.integrity_check);
            }
            resolve(isValid);
          }
        });
      });
    } catch (error) {
      logger.error('Database verification error:', error.message);
      return false;
    }
  }
}