#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { exec } = require('child_process');

class HealthChecker {
  constructor() {
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

    this.services = [
      {
        name: 'API Server',
        url: 'http://localhost:3000/health',
        critical: true,
        expectedContent: 'healthy'
      },
      {
        name: 'Frontend',
        url: 'http://localhost:5173',
        critical: true,
        expectedStatus: [200, 304]
      },
      {
        name: 'MT5 Service',
        url: 'http://localhost:5001/health',
        critical: false,
        expectedContent: 'healthy'
      }
    ];
  }

  log(message, color = 'white') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${this.colors[color]}[${timestamp}] ${message}${this.colors.reset}`);
  }

  async httpRequest(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            data: data,
            headers: response.headers
          });
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async checkService(service) {
    try {
      this.log(`Checking ${service.name}...`, 'cyan');
      
      const response = await this.httpRequest(service.url);
      
      // Check status code
      const expectedStatus = service.expectedStatus || [200];
      if (!expectedStatus.includes(response.statusCode)) {
        throw new Error(`Unexpected status code: ${response.statusCode}`);
      }

      // Check content if specified
      if (service.expectedContent) {
        if (!response.data.toLowerCase().includes(service.expectedContent.toLowerCase())) {
          throw new Error(`Expected content "${service.expectedContent}" not found`);
        }
      }

      this.log(`✅ ${service.name} is healthy`, 'green');
      
      return {
        name: service.name,
        status: 'healthy',
        responseTime: Date.now(),
        statusCode: response.statusCode,
        url: service.url
      };

    } catch (error) {
      const status = service.critical ? 'critical' : 'warning';
      const color = service.critical ? 'red' : 'yellow';
      
      this.log(`${service.critical ? '❌' : '⚠️'} ${service.name} is ${status}: ${error.message}`, color);
      
      return {
        name: service.name,
        status: status,
        error: error.message,
        url: service.url
      };
    }
  }

  async checkProcesses() {
    this.log('Checking running processes...', 'cyan');
    
    const processes = [
      { name: 'Node.js API', pattern: 'node.*index.js|tsx.*index.ts' },
      { name: 'Vite Dev Server', pattern: 'vite' },
      { name: 'Python MT5', pattern: 'python.*app.py' }
    ];

    const results = [];

    for (const process of processes) {
      try {
        await new Promise((resolve, reject) => {
          exec(`tasklist /FI "IMAGENAME eq node.exe" 2>nul || ps aux | grep -E "${process.pattern}" | grep -v grep`, 
            (error, stdout, stderr) => {
              if (error) {
                reject(error);
              } else {
                resolve(stdout);
              }
            }
          );
        });

        this.log(`✅ ${process.name} process is running`, 'green');
        results.push({ name: process.name, status: 'running' });

      } catch (error) {
        this.log(`⚠️ ${process.name} process not detected`, 'yellow');
        results.push({ name: process.name, status: 'not_detected' });
      }
    }

    return results;
  }

  async checkDatabaseConnection() {
    this.log('Checking database connection...', 'cyan');
    
    try {
      // Try to make a request to an API endpoint that uses the database
      const response = await this.httpRequest('http://localhost:3000/api/auth/health');
      
      if (response.statusCode === 200) {
        this.log('✅ Database connection is healthy', 'green');
        return { status: 'healthy' };
      } else {
        throw new Error(`Database health check failed with status ${response.statusCode}`);
      }
    } catch (error) {
      this.log(`❌ Database connection issue: ${error.message}`, 'red');
      return { status: 'error', error: error.message };
    }
  }

  async checkDiskSpace() {
    this.log('Checking disk space...', 'cyan');
    
    try {
      const command = process.platform === 'win32' 
        ? 'dir /-c' 
        : 'df -h .';
        
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            // Basic disk space check - just verify command works
            this.log('✅ Disk space check completed', 'green');
            resolve(stdout);
          }
        });
      });

      return { status: 'ok' };

    } catch (error) {
      this.log(`⚠️ Could not check disk space: ${error.message}`, 'yellow');
      return { status: 'unknown', error: error.message };
    }
  }

  async performFullHealthCheck() {
    console.log(`${this.colors.bright}${this.colors.cyan}`);
    console.log('╔═══════════════════════════════════════╗');
    console.log('║       🏥 TradeInsight Health Check    ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`${this.colors.reset}`);

    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      services: [],
      processes: [],
      database: null,
      system: {},
      overall: 'unknown'
    };

    try {
      // Check all services
      this.log('🔍 Checking service endpoints...', 'magenta');
      for (const service of this.services) {
        const result = await this.checkService(service);
        results.services.push(result);
      }

      // Check processes
      this.log('🔍 Checking running processes...', 'magenta');
      results.processes = await this.checkProcesses();

      // Check database
      this.log('🔍 Checking database connection...', 'magenta');
      results.database = await this.checkDatabaseConnection();

      // Check system resources
      this.log('🔍 Checking system resources...', 'magenta');
      results.system.diskSpace = await this.checkDiskSpace();

      // Determine overall health
      const criticalServicesFailed = results.services.filter(s => 
        s.status === 'critical' || (s.status !== 'healthy' && this.services.find(svc => svc.name === s.name)?.critical)
      );

      if (criticalServicesFailed.length === 0 && results.database.status === 'healthy') {
        results.overall = 'healthy';
      } else if (criticalServicesFailed.length === 0) {
        results.overall = 'degraded';
      } else {
        results.overall = 'unhealthy';
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Display summary
      console.log(`\n${this.colors.bright}${this.colors.white}`);
      console.log('╔═══════════════════════════════════════╗');
      console.log('║             Health Summary            ║');
      console.log('╚═══════════════════════════════════════╝');
      console.log(`${this.colors.reset}`);

      const statusColor = results.overall === 'healthy' ? 'green' : 
                         results.overall === 'degraded' ? 'yellow' : 'red';
      
      this.log(`Overall Status: ${results.overall.toUpperCase()}`, statusColor);
      this.log(`Check Duration: ${duration}ms`, 'white');
      this.log(`Services Healthy: ${results.services.filter(s => s.status === 'healthy').length}/${results.services.length}`, 'white');
      this.log(`Database: ${results.database.status}`, results.database.status === 'healthy' ? 'green' : 'red');

      if (results.overall !== 'healthy') {
        console.log(`\n${this.colors.yellow}Issues Found:${this.colors.reset}`);
        
        results.services.forEach(service => {
          if (service.status !== 'healthy') {
            this.log(`- ${service.name}: ${service.error || service.status}`, 'yellow');
          }
        });

        if (results.database.status !== 'healthy') {
          this.log(`- Database: ${results.database.error || results.database.status}`, 'yellow');
        }
      }

      console.log(`\n${this.colors.blue}💡 Tip: Run 'node start.js' to start all services${this.colors.reset}`);

      return results;

    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, 'red');
      results.overall = 'error';
      results.error = error.message;
      return results;
    }
  }

  async quickCheck() {
    this.log('⚡ Running quick health check...', 'cyan');
    
    const checks = [
      'http://localhost:3000/health',
      'http://localhost:5173',
      'http://localhost:5001/health'
    ];

    let healthy = 0;
    
    for (const url of checks) {
      try {
        await this.httpRequest(url);
        healthy++;
      } catch (error) {
        // Silent fail for quick check
      }
    }

    const status = healthy === checks.length ? 'All services running' :
                  healthy > 0 ? `${healthy}/${checks.length} services running` :
                  'No services detected';

    const color = healthy === checks.length ? 'green' :
                  healthy > 0 ? 'yellow' : 'red';

    this.log(`⚡ Quick Check: ${status}`, color);
    return { healthy, total: checks.length, status };
  }
}

// CLI interface
async function main() {
  const checker = new HealthChecker();
  const args = process.argv.slice(2);

  if (args.includes('--quick') || args.includes('-q')) {
    await checker.quickCheck();
  } else {
    const results = await checker.performFullHealthCheck();
    
    if (args.includes('--json')) {
      console.log(JSON.stringify(results, null, 2));
    }

    // Exit with appropriate code
    process.exit(results.overall === 'healthy' ? 0 : 1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}

module.exports = HealthChecker;