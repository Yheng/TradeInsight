#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

class DatabaseReset {
  constructor() {
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m',
      bright: '\x1b[1m'
    };
  }

  log(message, color = 'white') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${this.colors[color]}[${timestamp}] ${message}${this.colors.reset}`);
  }

  async resetDatabase() {
    try {
      console.log(`${this.colors.bright}${this.colors.yellow}`);
      console.log('╔═══════════════════════════════════════╗');
      console.log('║        🗄️  Database Reset Tool        ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log(`${this.colors.reset}`);

      // Locate database file
      const dbPath = path.join(__dirname, 'data', 'tradeinsight.db');
      
      this.log('🔍 Checking for existing database...', 'cyan');
      
      if (fs.existsSync(dbPath)) {
        this.log('📁 Database file found, backing up...', 'yellow');
        
        // Create backup
        const backupPath = path.join(__dirname, 'data', `tradeinsight.db.backup.${Date.now()}`);
        fs.copyFileSync(dbPath, backupPath);
        this.log(`✅ Backup created: ${path.basename(backupPath)}`, 'green');
        
        // Remove original
        fs.unlinkSync(dbPath);
        this.log('🗑️  Original database removed', 'yellow');
      } else {
        this.log('ℹ️  No existing database found', 'blue');
      }

      this.log('🏗️  Database will be recreated on next startup', 'green');
      
      console.log(`\n${this.colors.bright}${this.colors.green}`);
      console.log('╔═══════════════════════════════════════╗');
      console.log('║        ✅ Reset Complete!             ║');
      console.log('║                                       ║');
      console.log('║  Run "npm run start" to recreate     ║');
      console.log('║  the database with fresh schema      ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log(`${this.colors.reset}`);

    } catch (error) {
      this.log(`❌ Reset failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async showHelp() {
    console.log(`
${this.colors.bright}TradeInsight Database Reset Tool${this.colors.reset}

${this.colors.green}Usage:${this.colors.reset}
  node reset-database.js              Reset the database
  node reset-database.js --help       Show this help

${this.colors.yellow}What this does:${this.colors.reset}
  1. Creates a backup of the existing database
  2. Removes the current database file
  3. Next startup will create a fresh database with updated schema

${this.colors.blue}Use cases:${this.colors.reset}
  • Fix database schema issues
  • Start with a clean database for testing
  • Apply new database migrations
  • Resolve database corruption

${this.colors.red}Warning:${this.colors.reset} This will remove all existing data (backup is created)
    `);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const resetter = new DatabaseReset();

  if (args.includes('--help') || args.includes('-h')) {
    await resetter.showHelp();
  } else {
    await resetter.resetDatabase();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Database reset failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseReset;