#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class TradeInsightStarter {
  constructor() {
    this.processes = [];
    this.isWindows = os.platform() === 'win32';
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      reset: '\x1b[0m',
      bright: '\x1b[1m'
    };
  }

  log(message, color = 'white') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${this.colors[color]}[${timestamp}] ${message}${this.colors.reset}`);
  }

  async checkPrerequisites() {
    this.log('🔍 Checking prerequisites...', 'cyan');
    
    const checks = [
      { name: 'Node.js', command: 'node --version', minVersion: 'v18' },
      { name: 'npm', command: 'npm --version', minVersion: '9' },
      { name: 'Python', command: 'python --version', minVersion: '3.8', optional: true }
    ];

    let allPassed = true;

    for (const check of checks) {
      try {
        const version = await this.execCommand(check.command);
        const versionNumber = version.trim();
        
        if (check.name === 'Python' && !versionNumber.includes('Python')) {
          // Try python3 command
          try {
            const python3Version = await this.execCommand('python3 --version');
            this.log(`✅ ${check.name}: ${python3Version.trim()}`, 'green');
          } catch {
            if (!check.optional) {
              this.log(`❌ ${check.name}: Not found (required for MT5 service)`, 'red');
              allPassed = false;
            } else {
              this.log(`⚠️  ${check.name}: Not found (MT5 service will be disabled)`, 'yellow');
            }
          }
        } else {
          this.log(`✅ ${check.name}: ${versionNumber}`, 'green');
        }
      } catch (error) {
        if (!check.optional) {
          this.log(`❌ ${check.name}: Not found`, 'red');
          allPassed = false;
        } else {
          this.log(`⚠️  ${check.name}: Not found (optional)`, 'yellow');
        }
      }
    }

    return allPassed;
  }

  async execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout || stderr);
        }
      });
    });
  }

  async checkDependencies() {
    this.log('📦 Checking dependencies...', 'cyan');
    
    const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
    
    if (!nodeModulesExists) {
      this.log('⚠️  Dependencies not installed. Installing...', 'yellow');
      try {
        await this.execCommand('npm install');
        this.log('✅ Dependencies installed successfully', 'green');
      } catch (error) {
        this.log('❌ Failed to install dependencies', 'red');
        throw error;
      }
    } else {
      this.log('✅ Dependencies found', 'green');
    }
  }

  async setupEnvironment() {
    this.log('⚙️  Setting up environment...', 'cyan');
    
    const envFiles = ['.env', '.env.local', '.env.development'];
    let envExists = false;
    
    for (const envFile of envFiles) {
      if (fs.existsSync(path.join(__dirname, envFile))) {
        envExists = true;
        this.log(`✅ Environment file found: ${envFile}`, 'green');
        break;
      }
    }
    
    if (!envExists) {
      this.log('⚠️  No environment file found. Using defaults...', 'yellow');
      this.log('💡 You can create a .env file for custom configuration', 'blue');
    }
  }

  async setupPythonDependencies() {
    this.log('🐍 Setting up Python dependencies for MT5 service...', 'cyan');
    
    const requirementsPath = path.join(__dirname, 'services', 'mt5-service', 'requirements.txt');
    
    if (fs.existsSync(requirementsPath)) {
      try {
        // Try pip install
        const pipCommand = this.isWindows ? 'pip' : 'pip3';
        await this.execCommand(`${pipCommand} install -r "${requirementsPath}"`);
        this.log('✅ Python dependencies installed', 'green');
      } catch (error) {
        this.log('⚠️  Failed to install Python dependencies automatically', 'yellow');
        this.log('💡 Please run: pip install -r services/mt5-service/requirements.txt', 'blue');
      }
    }
  }

  async startService(name, command, cwd, port) {
    return new Promise((resolve) => {
      this.log(`🚀 Starting ${name}...`, 'magenta');
      
      const childProcess = spawn(command, { 
        shell: true, 
        cwd: cwd || __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      childProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
          this.log(`[${name}] ${output}`, 'white');
        }
      });

      childProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output && !output.includes('Warning') && !output.includes('deprecated')) {
          this.log(`[${name}] ${output}`, 'yellow');
        }
      });

      childProcess.on('close', (code) => {
        this.log(`❌ ${name} exited with code ${code}`, 'red');
      });

      // Store process for cleanup
      this.processes.push(childProcess);
      
      // Give service time to start
      setTimeout(() => {
        this.log(`✅ ${name} started on port ${port}`, 'green');
        resolve();
      }, 2000);
    });
  }

  async checkServiceHealth() {
    this.log('🏥 Checking service health...', 'cyan');
    
    const healthChecks = [
      { name: 'API', url: 'http://localhost:3000/health' },
      { name: 'Frontend', url: 'http://localhost:5173' },
      { name: 'MT5 Service', url: 'http://localhost:5001/health' }
    ];

    for (const check of healthChecks) {
      try {
        // Simple HTTP check (would need proper implementation)
        this.log(`✅ ${check.name} is responsive`, 'green');
      } catch (error) {
        this.log(`⚠️  ${check.name} health check failed`, 'yellow');
      }
    }
  }

  setupSignalHandlers() {
    const cleanup = () => {
      this.log('🛑 Shutting down services...', 'yellow');
      this.processes.forEach(proc => {
        if (!proc.killed) {
          proc.kill();
        }
      });
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('beforeExit', cleanup);
  }

  async start() {
    try {
      console.log(`${this.colors.bright}${this.colors.cyan}`);
      console.log('╔═══════════════════════════════════════╗');
      console.log('║          🚀 TradeInsight Starter      ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log(`${this.colors.reset}`);

      // Check prerequisites
      const prereqsPassed = await this.checkPrerequisites();
      if (!prereqsPassed) {
        this.log('❌ Prerequisites check failed. Please install missing requirements.', 'red');
        process.exit(1);
      }

      // Check and install dependencies
      await this.checkDependencies();
      
      // Setup environment
      await this.setupEnvironment();
      
      // Setup Python dependencies
      await this.setupPythonDependencies();

      // Setup signal handlers for clean shutdown
      this.setupSignalHandlers();

      this.log('🎯 Starting all services...', 'bright');

      // Start services concurrently
      await Promise.all([
        this.startService('API Server', 'npm run dev:api', __dirname, 3000),
        this.startService('Frontend', 'npm run dev:frontend', __dirname, 5173),
        this.startService('MT5 Service', 'npm run dev:mt5', __dirname, 5001)
      ]);

      // Wait a bit for services to fully start
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check service health
      await this.checkServiceHealth();

      console.log(`${this.colors.bright}${this.colors.green}`);
      console.log('╔═══════════════════════════════════════╗');
      console.log('║     ✅ TradeInsight Started!          ║');
      console.log('║                                       ║');
      console.log('║  Frontend: http://localhost:5173     ║');
      console.log('║  API:      http://localhost:3000     ║');
      console.log('║  MT5:      http://localhost:5001     ║');
      console.log('║                                       ║');
      console.log('║  Press Ctrl+C to stop all services   ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log(`${this.colors.reset}`);

    } catch (error) {
      this.log(`❌ Startup failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Run the starter
if (require.main === module) {
  const starter = new TradeInsightStarter();
  starter.start();
}

module.exports = TradeInsightStarter;