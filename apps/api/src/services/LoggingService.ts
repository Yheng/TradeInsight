import fs from 'fs';
import path from 'path';
import { logger } from '@tradeinsight/utils';

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  meta?: any;
  service?: string;
  userId?: string;
  requestId?: string;
  ip?: string;
}

export interface LogFilter {
  level?: string;
  service?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

class LoggingService {
  private logDir: string;
  private maxFileSize: number;
  private maxFiles: number;
  private currentLogFile: string;

  constructor() {
    this.logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    this.maxFileSize = parseInt(process.env.MAX_LOG_FILE_SIZE || '10485760'); // 10MB
    this.maxFiles = parseInt(process.env.MAX_LOG_FILES || '10');
    this.currentLogFile = this.getCurrentLogFile();
  }

  async initialize(): Promise<void> {
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
      logger.info('Created log directory', { path: this.logDir });
    }

    // Clean up old log files
    await this.cleanupOldLogs();
  }

  private getCurrentLogFile(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `tradeinsight-${date}.log`);
  }

  async writeLog(entry: LogEntry): Promise<void> {
    try {
      // Check if we need to rotate the log file
      await this.rotateLogIfNeeded();

      const logLine = JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString()
      }) + '\n';

      // Append to log file
      fs.appendFileSync(this.currentLogFile, logLine);
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', error);
      console.log('Log entry:', entry);
    }
  }

  async log(
    level: LogEntry['level'],
    message: string,
    meta?: any,
    service?: string,
    userId?: string,
    requestId?: string,
    ip?: string
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      service,
      userId,
      requestId,
      ip
    };

    await this.writeLog(entry);
  }

  async getLogs(
    filter: LogFilter = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const logs: LogEntry[] = [];
      const logFiles = await this.getLogFiles();

      // Read logs from files (newest first)
      for (const file of logFiles.reverse()) {
        if (logs.length >= limit + offset) break;

        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        // Parse each line and apply filters
        for (const line of lines.reverse()) {
          if (logs.length >= limit + offset) break;

          try {
            const entry: LogEntry = JSON.parse(line);
            
            if (this.matchesFilter(entry, filter)) {
              logs.push(entry);
            }
          } catch (error) {
            // Skip invalid JSON lines
          }
        }
      }

      // Apply pagination
      const paginatedLogs = logs.slice(offset, offset + limit);

      return {
        logs: paginatedLogs,
        total: logs.length
      };
    } catch (error) {
      logger.error('Failed to read logs', { error: error.message });
      return { logs: [], total: 0 };
    }
  }

  private matchesFilter(entry: LogEntry, filter: LogFilter): boolean {
    // Level filter
    if (filter.level && entry.level !== filter.level) {
      return false;
    }

    // Service filter
    if (filter.service && entry.service !== filter.service) {
      return false;
    }

    // User ID filter
    if (filter.userId && entry.userId !== filter.userId) {
      return false;
    }

    // Date range filter
    const entryDate = new Date(entry.timestamp);
    if (filter.startDate && entryDate < filter.startDate) {
      return false;
    }
    if (filter.endDate && entryDate > filter.endDate) {
      return false;
    }

    // Search filter (searches in message and meta)
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchLower);
      const metaMatch = entry.meta && 
        JSON.stringify(entry.meta).toLowerCase().includes(searchLower);
      
      if (!messageMatch && !metaMatch) {
        return false;
      }
    }

    return true;
  }

  private async rotateLogIfNeeded(): Promise<void> {
    const currentFile = this.getCurrentLogFile();
    
    // Update current log file if date changed
    if (currentFile !== this.currentLogFile) {
      this.currentLogFile = currentFile;
    }

    // Check file size
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= this.maxFileSize) {
        // Rotate the file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.currentLogFile, rotatedFile);
        
        logger.info('Log file rotated', { 
          from: this.currentLogFile, 
          to: rotatedFile,
          size: stats.size 
        });
      }
    }
  }

  private async getLogFiles(): Promise<string[]> {
    if (!fs.existsSync(this.logDir)) {
      return [];
    }

    const files = fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.log'))
      .sort();

    return files;
  }

  private async cleanupOldLogs(): Promise<void> {
    try {
      const logFiles = await this.getLogFiles();
      
      if (logFiles.length > this.maxFiles) {
        const filesToDelete = logFiles.slice(0, logFiles.length - this.maxFiles);
        
        for (const file of filesToDelete) {
          const filePath = path.join(this.logDir, file);
          fs.unlinkSync(filePath);
          logger.info('Deleted old log file', { file });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old logs', { error: error.message });
    }
  }

  async getLogStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestLog: string | null;
    newestLog: string | null;
    levelCounts: Record<string, number>;
  }> {
    try {
      const logFiles = await this.getLogFiles();
      let totalSize = 0;
      const levelCounts: Record<string, number> = {};

      // Calculate total size
      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      // Count log levels from recent files (last 3 files for performance)
      const recentFiles = logFiles.slice(-3);
      for (const file of recentFiles) {
        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const entry: LogEntry = JSON.parse(line);
            levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;
          } catch (error) {
            // Skip invalid JSON lines
          }
        }
      }

      return {
        totalFiles: logFiles.length,
        totalSize,
        oldestLog: logFiles.length > 0 ? logFiles[0] : null,
        newestLog: logFiles.length > 0 ? logFiles[logFiles.length - 1] : null,
        levelCounts
      };
    } catch (error) {
      logger.error('Failed to get log stats', { error: error.message });
      return {
        totalFiles: 0,
        totalSize: 0,
        oldestLog: null,
        newestLog: null,
        levelCounts: {}
      };
    }
  }

  async exportLogs(
    filter: LogFilter = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { logs } = await this.getLogs(filter, 10000); // Export up to 10k logs

    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'service', 'userId', 'requestId', 'ip'];
      const csvLines = [headers.join(',')];

      for (const log of logs) {
        const row = [
          log.timestamp,
          log.level,
          `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
          log.service || '',
          log.userId || '',
          log.requestId || '',
          log.ip || ''
        ];
        csvLines.push(row.join(','));
      }

      return csvLines.join('\n');
    } else {
      return JSON.stringify(logs, null, 2);
    }
  }

  // Convenience methods for different log levels
  async info(message: string, meta?: any, service?: string, userId?: string, requestId?: string, ip?: string): Promise<void> {
    await this.log('info', message, meta, service, userId, requestId, ip);
  }

  async warn(message: string, meta?: any, service?: string, userId?: string, requestId?: string, ip?: string): Promise<void> {
    await this.log('warn', message, meta, service, userId, requestId, ip);
  }

  async error(message: string, meta?: any, service?: string, userId?: string, requestId?: string, ip?: string): Promise<void> {
    await this.log('error', message, meta, service, userId, requestId, ip);
  }

  async debug(message: string, meta?: any, service?: string, userId?: string, requestId?: string, ip?: string): Promise<void> {
    await this.log('debug', message, meta, service, userId, requestId, ip);
  }
}

export const loggingService = new LoggingService();