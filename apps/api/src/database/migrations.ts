import { DatabaseService } from './DatabaseService';
import { logger } from '@tradeinsight/utils';

export class DatabaseMigrations {
  /**
   * Run all pending migrations
   */
  static async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await DatabaseService.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT UNIQUE NOT NULL,
          description TEXT NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Get already executed migrations
      const executedMigrations = await DatabaseService.all<{ version: string }>(`
        SELECT version FROM migrations ORDER BY version
      `);

      const executedVersions = new Set(executedMigrations.map(m => m.version));

      // Define all migrations
      const migrations = [
        {
          version: '001_add_social_metrics_columns',
          description: 'Add missing columns to social_metrics table',
          up: async () => {
            // Check if table exists first
            const tableExists = await this.tableExists('social_metrics');
            if (!tableExists) {
              logger.info('social_metrics table does not exist, skipping column migration');
              return;
            }

            // Check if columns exist before adding them
            const tableInfo = await this.getTableInfo('social_metrics');
            const existingColumns = new Set(tableInfo.map(col => col.name));

            const columnsToAdd = [
              { name: 'is_public', sql: 'ALTER TABLE social_metrics ADD COLUMN is_public BOOLEAN DEFAULT 0' },
              { name: 'share_win_rate', sql: 'ALTER TABLE social_metrics ADD COLUMN share_win_rate BOOLEAN DEFAULT 0' },
              { name: 'share_volume', sql: 'ALTER TABLE social_metrics ADD COLUMN share_volume BOOLEAN DEFAULT 0' },
              { name: 'share_risk_score', sql: 'ALTER TABLE social_metrics ADD COLUMN share_risk_score BOOLEAN DEFAULT 0' },
              { name: 'total_trades', sql: 'ALTER TABLE social_metrics ADD COLUMN total_trades INTEGER DEFAULT 0' },
              { name: 'total_profit', sql: 'ALTER TABLE social_metrics ADD COLUMN total_profit REAL DEFAULT 0' },
              { name: 'total_volume', sql: 'ALTER TABLE social_metrics ADD COLUMN total_volume REAL DEFAULT 0' },
              { name: 'profit_factor', sql: 'ALTER TABLE social_metrics ADD COLUMN profit_factor REAL DEFAULT 0' },
              { name: 'avg_risk_score', sql: 'ALTER TABLE social_metrics ADD COLUMN avg_risk_score REAL DEFAULT 5.0' },
              { name: 'best_trade', sql: 'ALTER TABLE social_metrics ADD COLUMN best_trade REAL DEFAULT 0' },
              { name: 'worst_trade', sql: 'ALTER TABLE social_metrics ADD COLUMN worst_trade REAL DEFAULT 0' },
              { name: 'symbols_traded', sql: 'ALTER TABLE social_metrics ADD COLUMN symbols_traded INTEGER DEFAULT 0' },
              { name: 'last_active', sql: 'ALTER TABLE social_metrics ADD COLUMN last_active DATETIME DEFAULT CURRENT_TIMESTAMP' }
            ];

            for (const column of columnsToAdd) {
              if (!existingColumns.has(column.name)) {
                await DatabaseService.run(column.sql);
                logger.info(`Added column ${column.name} to social_metrics`);
              }
            }
          }
        },
        {
          version: '002_add_trades_status_column',
          description: 'Add status column to trades table',
          up: async () => {
            const tableInfo = await this.getTableInfo('trades');
            const existingColumns = new Set(tableInfo.map(col => col.name));

            if (!existingColumns.has('status')) {
              await DatabaseService.run('ALTER TABLE trades ADD COLUMN status TEXT DEFAULT "open"');
              logger.info('Added status column to trades table');
            }
          }
        },
        {
          version: '003_add_risk_score_to_user_risk_profiles',
          description: 'Add risk_score column to user_risk_profiles table',
          up: async () => {
            const tableInfo = await this.getTableInfo('user_risk_profiles');
            const existingColumns = new Set(tableInfo.map(col => col.name));

            if (!existingColumns.has('risk_score')) {
              await DatabaseService.run('ALTER TABLE user_risk_profiles ADD COLUMN risk_score REAL DEFAULT 5.0');
              logger.info('Added risk_score column to user_risk_profiles table');
            }
          }
        },
        {
          version: '004_update_feedback_table_structure',
          description: 'Update feedback table structure for social features',
          up: async () => {
            const tableInfo = await this.getTableInfo('feedback');
            const existingColumns = new Set(tableInfo.map(col => col.name));

            // Check if we need to update the feedback table structure
            if (!existingColumns.has('type') || !existingColumns.has('category')) {
              // Create new feedback table with correct structure
              await DatabaseService.run(`
                CREATE TABLE feedback_new (
                  id TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL,
                  type TEXT NOT NULL,
                  category TEXT NOT NULL,
                  rating INTEGER NOT NULL,
                  message TEXT NOT NULL,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users (id)
                )
              `);

              // Copy existing data if any (convert old structure to new)
              await DatabaseService.run(`
                INSERT INTO feedback_new (id, user_id, type, category, rating, message, created_at)
                SELECT 
                  id, 
                  user_id, 
                  COALESCE(step, 'general') as type,
                  'platform' as category,
                  COALESCE(rating, 5) as rating,
                  COALESCE(comment, 'No comment') as message,
                  COALESCE(timestamp, CURRENT_TIMESTAMP) as created_at
                FROM feedback
              `);

              // Drop old table and rename new one
              await DatabaseService.run('DROP TABLE feedback');
              await DatabaseService.run('ALTER TABLE feedback_new RENAME TO feedback');
              
              logger.info('Updated feedback table structure');
            }
          }
        }
      ];

      // Execute pending migrations
      for (const migration of migrations) {
        if (!executedVersions.has(migration.version)) {
          logger.info(`Running migration: ${migration.version} - ${migration.description}`);
          
          try {
            await migration.up();
            
            // Record successful migration
            await DatabaseService.run(`
              INSERT INTO migrations (version, description) VALUES (?, ?)
            `, [migration.version, migration.description]);
            
            logger.info(`Migration ${migration.version} completed successfully`);
          } catch (error) {
            logger.error(`Migration ${migration.version} failed:`, error);
            throw error;
          }
        }
      }

      logger.info('All database migrations completed');

    } catch (error) {
      logger.error('Database migration failed:', error);
      throw error;
    }
  }

  /**
   * Get table structure information
   */
  private static async getTableInfo(tableName: string): Promise<Array<{name: string, type: string}>> {
    try {
      const result = await DatabaseService.all<{name: string, type: string}>(`
        PRAGMA table_info(${tableName})
      `);
      return result;
    } catch (error) {
      // Table doesn't exist
      return [];
    }
  }

  /**
   * Check if a table exists
   */
  private static async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await DatabaseService.get<{count: number}>(`
        SELECT COUNT(*) as count FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [tableName]);
      return (result?.count || 0) > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Reset database (for development only)
   */
  static async resetDatabase(): Promise<void> {
    logger.warn('Resetting database - all data will be lost!');
    
    const tables = [
      'migrations', 'users', 'trades', 'market_data', 'alerts', 'ai_analyses',
      'risk_metrics', 'user_mt5_credentials', 'user_risk_profiles', 
      'social_metrics', 'feedback', 'audit_logs', 'fetch_errors'
    ];

    for (const table of tables) {
      try {
        await DatabaseService.run(`DROP TABLE IF EXISTS ${table}`);
      } catch (error) {
        // Ignore errors for non-existent tables
      }
    }

    logger.info('Database reset completed');
  }
}