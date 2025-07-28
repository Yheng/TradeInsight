const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { execSync } = require('child_process');

class BackupSystem {
  constructor() {
    this.dbPath = path.join(__dirname, 'data', 'tradeinsight.db');
    this.backupDir = path.join(__dirname, 'backups');
    this.maxBackups = 30; // Keep 30 backups maximum
  }

  async initialize() {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log('📁 Created backup directory:', this.backupDir);
    }
  }

  generateBackupName(type = 'manual') {
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .slice(0, 19);
    return `tradeinsight-${type}-${timestamp}.db`;
  }

  async createBackup(type = 'manual', description = '') {
    console.log(`🔄 Creating ${type} backup...`);
    
    try {
      await this.initialize();
      
      const backupName = this.generateBackupName(type);
      const backupPath = path.join(this.backupDir, backupName);
      
      // Copy database file
      if (fs.existsSync(this.dbPath)) {
        fs.copyFileSync(this.dbPath, backupPath);
        
        // Create metadata file
        const metadata = {
          timestamp: new Date().toISOString(),
          type,
          description,
          originalPath: this.dbPath,
          size: fs.statSync(backupPath).size,
          version: this.getDatabaseVersion()
        };
        
        const metadataPath = backupPath.replace('.db', '.meta.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        
        console.log('✅ Backup created successfully!');
        console.log('📄 File:', backupName);
        console.log('📏 Size:', this.formatBytes(metadata.size));
        console.log('🕒 Time:', metadata.timestamp);
        
        // Clean up old backups
        this.cleanupOldBackups();
        
        return { backupPath, metadata };
      } else {
        throw new Error('Database file not found');
      }
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      throw error;
    }
  }

  async restoreBackup(backupName) {
    console.log('🔄 Restoring backup:', backupName);
    
    try {
      const backupPath = path.join(this.backupDir, backupName);
      const metadataPath = backupPath.replace('.db', '.meta.json');
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      // Read metadata
      let metadata = {};
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        console.log('📄 Backup info:');
        console.log('  Type:', metadata.type);
        console.log('  Created:', metadata.timestamp);
        console.log('  Description:', metadata.description || 'None');
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
      
      console.log('✅ Backup restored successfully!');
      console.log('📁 Restored to:', this.dbPath);
      
      return { success: true, metadata };
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  listBackups() {
    console.log('📋 Available backups:');
    
    if (!fs.existsSync(this.backupDir)) {
      console.log('No backups found.');
      return [];
    }
    
    const backups = [];
    const files = fs.readdirSync(this.backupDir);
    const dbFiles = files.filter(file => file.endsWith('.db'));
    
    dbFiles.forEach(file => {
      const backupPath = path.join(this.backupDir, file);
      const metadataPath = backupPath.replace('.db', '.meta.json');
      const stats = fs.statSync(backupPath);
      
      let metadata = {
        timestamp: stats.mtime.toISOString(),
        type: 'unknown',
        description: ''
      };
      
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (error) {
          console.warn('⚠️  Could not read metadata for:', file);
        }
      }
      
      const backup = {
        name: file,
        path: backupPath,
        size: stats.size,
        created: metadata.timestamp,
        type: metadata.type,
        description: metadata.description
      };
      
      backups.push(backup);
      
      console.log(`\n📄 ${file}`);
      console.log(`   Type: ${metadata.type}`);
      console.log(`   Created: ${new Date(metadata.timestamp).toLocaleString()}`);
      console.log(`   Size: ${this.formatBytes(stats.size)}`);
      if (metadata.description) {
        console.log(`   Description: ${metadata.description}`);
      }
    });
    
    return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
  }

  cleanupOldBackups() {
    const files = fs.readdirSync(this.backupDir);
    const dbFiles = files.filter(file => file.endsWith('.db'));
    
    if (dbFiles.length > this.maxBackups) {
      // Sort by modification time
      const backups = dbFiles.map(file => {
        const filePath = path.join(this.backupDir, file);
        return {
          name: file,
          path: filePath,
          mtime: fs.statSync(filePath).mtime
        };
      }).sort((a, b) => b.mtime - a.mtime);
      
      // Remove oldest backups
      const toDelete = backups.slice(this.maxBackups);
      toDelete.forEach(backup => {
        try {
          fs.unlinkSync(backup.path);
          // Also remove metadata file if it exists
          const metadataPath = backup.path.replace('.db', '.meta.json');
          if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
          }
          console.log('🗑️  Removed old backup:', backup.name);
        } catch (error) {
          console.warn('⚠️  Could not remove backup:', backup.name, error.message);
        }
      });
    }
  }

  scheduleAutomaticBackups() {
    // Schedule daily backups at 2 AM
    const schedule = require('node-schedule');
    
    const job = schedule.scheduleJob('0 2 * * *', async () => {
      try {
        await this.createBackup('scheduled', 'Daily automatic backup');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
      }
    });
    
    console.log('⏰ Scheduled automatic daily backups at 2:00 AM');
    return job;
  }

  getDatabaseVersion() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        return 'unknown';
      }
      
      const db = new sqlite3.Database(this.dbPath);
      return new Promise((resolve) => {
        db.get("PRAGMA user_version", (err, row) => {
          db.close();
          resolve(row ? row.user_version : 'unknown');
        });
      });
    } catch (error) {
      return 'unknown';
    }
  }

  async verifyBackup(backupName) {
    console.log('🔍 Verifying backup:', backupName);
    
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      // Test database integrity
      const db = new sqlite3.Database(backupPath, sqlite3.OPEN_READONLY);
      
      return new Promise((resolve, reject) => {
        db.get("PRAGMA integrity_check", (err, row) => {
          db.close();
          
          if (err) {
            reject(new Error('Database verification failed: ' + err.message));
          } else if (row.integrity_check === 'ok') {
            console.log('✅ Backup verification successful');
            resolve(true);
          } else {
            reject(new Error('Database integrity check failed: ' + row.integrity_check));
          }
        });
      });
    } catch (error) {
      console.error('❌ Backup verification failed:', error.message);
      throw error;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async exportToSQL(backupName, outputPath) {
    console.log('📤 Exporting backup to SQL:', backupName);
    
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      // Use sqlite3 command line tool to export
      const command = `sqlite3 "${backupPath}" .dump > "${outputPath}"`;
      execSync(command);
      
      console.log('✅ SQL export completed:', outputPath);
      return outputPath;
    } catch (error) {
      console.error('❌ SQL export failed:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const backupSystem = new BackupSystem();
  const command = process.argv[2];
  const argument = process.argv[3];
  const description = process.argv[4];

  async function run() {
    try {
      switch (command) {
        case 'create':
          await backupSystem.createBackup('manual', description || 'Manual backup');
          break;
        
        case 'restore':
          if (!argument) {
            console.error('❌ Please specify backup name to restore');
            process.exit(1);
          }
          await backupSystem.restoreBackup(argument);
          break;
        
        case 'list':
          backupSystem.listBackups();
          break;
        
        case 'verify':
          if (!argument) {
            console.error('❌ Please specify backup name to verify');
            process.exit(1);
          }
          await backupSystem.verifyBackup(argument);
          break;
        
        case 'export':
          if (!argument) {
            console.error('❌ Please specify backup name to export');
            process.exit(1);
          }
          const outputPath = description || argument.replace('.db', '.sql');
          await backupSystem.exportToSQL(argument, outputPath);
          break;
        
        case 'schedule':
          backupSystem.scheduleAutomaticBackups();
          console.log('✅ Automatic backups scheduled');
          break;
        
        default:
          console.log(`
🗄️  TradeInsight Backup System

Usage:
  node backup-system.js <command> [arguments]

Commands:
  create [description]          Create a manual backup
  restore <backup-name>         Restore from backup
  list                         List all available backups
  verify <backup-name>         Verify backup integrity
  export <backup-name> [path]  Export backup to SQL file
  schedule                     Enable automatic daily backups

Examples:
  node backup-system.js create "Before major update"
  node backup-system.js restore tradeinsight-manual-2024-01-15T10-30-00.db
  node backup-system.js list
  node backup-system.js verify tradeinsight-manual-2024-01-15T10-30-00.db
          `);
      }
    } catch (error) {
      console.error('❌ Operation failed:', error.message);
      process.exit(1);
    }
  }

  run();
}

module.exports = BackupSystem;