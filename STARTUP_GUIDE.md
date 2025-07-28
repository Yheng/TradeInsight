# 🚀 TradeInsight Startup Guide

## The Fastest Way to Start

```bash
cd "D:\Vibe Coding Projects\TradeInsight"
npm run start
```

That's it! The smart startup script will handle everything for you.

## What Happens When You Run `npm run start`

### 1. Prerequisites Check ✅
- Checks for Node.js 18+
- Checks for npm 9+
- Checks for Python 3.8+ (optional)
- Shows clear error messages if anything is missing

### 2. Dependency Installation 📦
- Automatically installs Node.js dependencies (`npm install`)
- Installs Python dependencies for MT5 service
- Only runs if dependencies are missing

### 3. Environment Setup ⚙️
- Checks for `.env` file
- Offers to create one from template if missing
- Provides helpful configuration tips

### 4. Service Startup 🚀
- Starts API server on port 3000
- Starts frontend on port 5173  
- Starts MT5 service on port 5001
- Shows real-time logs from all services

### 5. Health Monitoring 🏥
- Checks that all services are responding
- Provides service status dashboard
- Shows helpful error messages if anything fails

## Alternative Startup Commands

### Quick Development
```bash
npm run dev              # Start all services (no checks)
npm run dev:api          # Start only API server
npm run dev:frontend     # Start only frontend
npm run dev:mt5          # Start only MT5 service
```

### Health Checks
```bash
npm run health           # Full health check with diagnostics
npm run health:quick     # Quick ping test of all services
```

### Setup Commands
```bash
npm run setup            # Install all dependencies
npm run setup:env        # Copy environment template
```

## Service URLs

Once started, access your application at:

- **🌐 Frontend Application**: http://localhost:5173
- **🔧 API Server**: http://localhost:3000  
- **📊 API Health Check**: http://localhost:3000/health
- **🐍 MT5 Service**: http://localhost:5001
- **📈 MT5 Health Check**: http://localhost:5001/health

## First Time Setup

### 1. Environment Configuration
If you want to customize settings, edit the `.env` file:

```bash
# Copy the template (done automatically by npm run start)
cp .env.example .env

# Edit with your preferred editor
notepad .env          # Windows
nano .env            # Linux/Mac
code .env            # VS Code
```

### 2. MT5 Configuration (Optional)
For live trading with MetaTrader 5, add your credentials to `.env`:

```env
MT5_SERVER=your-broker-server
MT5_LOGIN=your-account-number  
MT5_PASSWORD=your-password
```

**Note**: MT5 credentials are optional. The app works in demo mode without them.

## Troubleshooting

### Common Issues

#### ❌ "Node.js not found"
- Install Node.js 18+ from https://nodejs.org
- Restart your terminal after installation

#### ❌ "Python not found" 
- Install Python 3.8+ from https://python.org
- Make sure Python is in your PATH
- Try `python3` if `python` doesn't work

#### ❌ "Port already in use"
- Close other applications using ports 3000, 5173, or 5001
- Or change ports in `.env` file

#### ❌ Services won't start
- Run `npm run health` to diagnose issues
- Check the logs in the startup script output
- Ensure all dependencies are installed

#### ❌ Database errors (SQLITE_ERROR)
- Run `npm run db:reset` to recreate the database with latest schema
- This creates a backup of existing data before resetting
- Database will be automatically recreated on next startup

### Database Management
```bash
npm run db:reset     # Reset database (creates backup)
npm run health       # Check database connectivity
```

### Getting Help

1. **Check service status**: `npm run health`
2. **View detailed logs**: Look at the startup script output
3. **Restart services**: Press Ctrl+C and run `npm run start` again
4. **Clean restart**: Run `npm run clean` then `npm run start`

## Development Workflow

### Daily Development
```bash
npm run start        # Start everything with monitoring
# Work on your code...
# Press Ctrl+C to stop all services
```

### Building for Production
```bash
npm run build        # Build all packages
npm run health       # Verify everything works
```

### Code Quality
```bash
npm run lint         # Check code style
npm run lint:fix     # Fix auto-fixable issues
npm run typecheck    # Verify TypeScript types
```

## Architecture Overview

When you run `npm run start`, these services start:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   MT5 Service   │
│   React App     │    │   Node.js       │    │   Python Flask  │
│   Port: 5173    │────│   Port: 3000    │────│   Port: 5001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
    Browser UI              SQLite Database        MetaTrader 5
```

## Next Steps

1. **🌐 Open http://localhost:5173** to see the application
2. **📝 Register a new account** or use demo credentials
3. **🔍 Explore the features** - Dashboard, Trading, Analytics, Social
4. **⚙️ Configure MT5 connection** (optional) for live data
5. **📊 Check out the admin dashboard** (admin users only)

## Support

- **📖 Full Documentation**: See `DEPLOYMENT_GUIDE.md`
- **🏥 Health Monitoring**: `npm run health`
- **🔧 Configuration**: Edit `.env` file
- **🐛 Issues**: Check the console output and logs

Happy Trading! 🚀📈