import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../database/DatabaseService';
import { logger } from '@tradeinsight/utils';

export interface BackupMetadata {
  timestamp: string;
  type: 'manual' | 'scheduled' | 'pre-restore' | 'pre-migration';
  description: string;
  originalPath: string;
  size: number;
  version: string | number;
  checksum?: string;
}

export interface BackupInfo {
  name: string;
  path: string;
  size: number;
  created: string;
  type: string;
  description: string;
  metadata?: BackupMetadata;
}

export class BackupService {
  private dbPath: string;
  private backupDir: string;
  private maxBackups: number;

  constructor() {
    this.dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'tradeinsight.db');
    this.backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    this.maxBackups = parseInt(process.env.MAX_BACKUPS || '30');
  }

  async initialize(): Promise<void> {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('Created backup directory', { path: this.backupDir });
    }
  }

  private generateBackupName(type: string = 'manual'): string {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .slice(0, 19);
    return `tradeinsight-${type}-${timestamp}.db`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async createBackup(type: string = 'manual', description: string = ''): Promise<BackupInfo> {
    logger.info('Creating backup', { type, description });
    
    try {
      await this.initialize();
      
      const backupName = this.generateBackupName(type);
      const backupPath = path.join(this.backupDir, backupName);
      
      // Check if source database exists
      if (!fs.existsSync(this.dbPath)) {
        throw new Error('Source database file not found');
      }
      
      // Copy database file
      fs.copyFileSync(this.dbPath, backupPath);
      
      // Get file stats
      const stats = fs.statSync(backupPath);
      
      // Create metadata
      const metadata: BackupMetadata = {
        timestamp: new Date().toISOString(),
        type: type as any,
        description,
        originalPath: this.dbPath,
        size: stats.size,
        version: await this.getDatabaseVersion()
      };
      
      // Save metadata
      const metadataPath = backupPath.replace('.db', '.meta.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      const backupInfo: BackupInfo = {
        name: backupName,
        path: backupPath,
        size: stats.size,
        created: metadata.timestamp,
        type,
        description,
        metadata
      };
      
      logger.info('Backup created successfully', {
        name: backupName,
        size: this.formatBytes(stats.size)
      });
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      return backupInfo;
    } catch (error) {
      logger.error('Backup creation failed', { error: error.message });
      throw error;
    }
  }

  async restoreBackup(backupName: string): Promise<void> {
    logger.info('Restoring backup', { backupName });
    
    try {
      const backupPath = path.join(this.backupDir, backupName);
      const metadataPath = backupPath.replace('.db', '.meta.json');
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      // Read metadata if available
      let metadata: BackupMetadata | null = null;
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        logger.info('Backup metadata', metadata);
      }
      
      // Create backup of current database before restore
      if (fs.existsSync(this.dbPath)) {
        await this.createBackup('pre-restore', `Backup before restoring ${backupName}`);
      }
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Restore the backup
      fs.copyFileSync(backupPath, this.dbPath);
      
      logger.info('Backup restored successfully', { backupName, targetPath: this.dbPath });
    } catch (error) {
      logger.error('Backup restoration failed', { error: error.message, backupName });
      throw error;
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }
    
    const backups: BackupInfo[] = [];
    const files = fs.readdirSync(this.backupDir);
    const dbFiles = files.filter(file => file.endsWith('.db'));
    
    for (const file of dbFiles) {
      const backupPath = path.join(this.backupDir, file);
      const metadataPath = backupPath.replace('.db', '.meta.json');
      const stats = fs.statSync(backupPath);
      
      let metadata: BackupMetadata = {
        timestamp: stats.mtime.toISOString(),
        type: 'manual',
        description: '',
        originalPath: this.dbPath,
        size: stats.size,
        version: 'unknown'
      };
      
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (error) {
          logger.warn('Could not read metadata', { file, error: error.message });
        }
      }
      
      backups.push({
        name: file,
        path: backupPath,
        size: stats.size,
        created: metadata.timestamp,
        type: metadata.type,
        description: metadata.description,
        metadata
      });
    }
    
    return backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }

  async verifyBackup(backupName: string): Promise<boolean> {
    logger.info('Verifying backup', { backupName });
    
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      // Test database integrity using DatabaseService
      const isValid = await DatabaseService.verifyDatabase(backupPath);
      
      if (isValid) {
        logger.info('Backup verification successful', { backupName });
      } else {
        logger.error('Backup verification failed', { backupName });
      }
      
      return isValid;
    } catch (error) {
      logger.error('Backup verification error', { error: error.message, backupName });
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          try {
            fs.unlinkSync(backup.path);
            
            // Also remove metadata file
            const metadataPath = backup.path.replace('.db', '.meta.json');
            if (fs.existsSync(metadataPath)) {
              fs.unlinkSync(metadataPath);
            }
            
            logger.info('Removed old backup', { name: backup.name });
          } catch (error) {
            logger.warn('Could not remove old backup', { 
              name: backup.name, 
              error: error.message 
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups', { error: error.message });
    }
  }

  private async getDatabaseVersion(): Promise<string | number> {
    try {
      if (!fs.existsSync(this.dbPath)) {
        return 'unknown';
      }
      
      const result = await DatabaseService.get<{ user_version: number }>(
        'PRAGMA user_version'
      );
      
      return result?.user_version || 'unknown';
    } catch (error) {
      logger.warn('Could not get database version', { error: error.message });
      return 'unknown';
    }
  }

  async scheduleAutomaticBackups(): Promise<void> {
    // This would be called from the main server initialization
    // to set up automatic backups using node-schedule
    const schedule = require('node-schedule');
    
    // Schedule daily backups at 2 AM
    const job = schedule.scheduleJob('0 2 * * *', async () => {
      try {
        await this.createBackup('scheduled', 'Daily automatic backup');
      } catch (error) {
        logger.error('Scheduled backup failed', { error: error.message });
      }
    });
    
    logger.info('Scheduled automatic daily backups at 2:00 AM');
  }

  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    types: Record<string, number>;
  }> {
    const backups = await this.listBackups();
    
    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].created : null,
      newestBackup: backups.length > 0 ? backups[0].created : null,
      types: backups.reduce((acc, backup) => {
        acc[backup.type] = (acc[backup.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return stats;
  }
}

export const backupService = new BackupService();