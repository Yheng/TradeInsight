# TradeInsight

Advanced Trading Analytics Platform with MetaTrader 5 Integration

## Features

- **Real-time Market Data**: Live price feeds and market analysis
- **MT5 Integration**: Direct connection to MetaTrader 5 platform
- **AI-Powered Analytics**: Intelligent trading recommendations and risk assessment
- **Portfolio Management**: Comprehensive trade tracking and performance metrics
- **Risk Management**: Advanced risk analysis and alert systems
- **User Authentication**: Secure user management with JWT

## Architecture

This is a modular monorepo application built with:

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite with migrations
- **MT5 Service**: Python + Flask + MetaTrader5 library
- **Shared Packages**: TypeScript types and utilities

## Project Structure

```
TradeInsight/
├── packages/           # Shared modules
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Shared utilities and helpers
├── apps/              # Applications
│   └── api/           # Backend API server
├── services/          # Microservices
│   └── mt5-service/   # Python MT5 integration service
├── data/              # Database files
└── docs/              # Documentation
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **npm 9+**
- **Python 3.8+** with pip
- **MetaTrader 5 terminal** (optional, for live trading)

### Easy Installation

#### Option 1: Automated Setup (Recommended)
```bash
# The smart way - checks prerequisites and handles setup
npm run start
```

This interactive script will:
- ✅ Check all prerequisites
- 📦 Install dependencies automatically
- ⚙️ Set up environment configuration
- 🐍 Install Python requirements
- 🚀 Start all services with health monitoring

#### Option 2: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
npm run setup:env
# Edit .env with your configuration

# 3. Install Python dependencies
pip install -r services/mt5-service/requirements.txt

# 4. Start all services
npm run dev
```

### Service URLs
- **Frontend**: http://localhost:5173
- **API Server**: http://localhost:3000
- **MT5 Service**: http://localhost:5001
- **Health Check**: http://localhost:3000/health

### Health Monitoring
```bash
# Full health check with detailed diagnostics
npm run health

# Quick health check
npm run health:quick
```

### Configuration

Edit the `.env` file with your settings:

- **JWT_SECRET**: Secret key for authentication
- **MT5_LOGIN/PASSWORD/SERVER**: Your MetaTrader 5 credentials
- **Database and service URLs**

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Trading
- `GET /api/trades` - Get user trades
- `POST /api/trades` - Create new trade
- `PUT /api/trades/:id/close` - Close trade

### Market Data
- `GET /api/market/symbols/:symbol` - Get real-time symbol data
- `GET /api/market/symbols/:symbol/history` - Get historical data

### Analytics
- `GET /api/analytics/ai/:symbol` - Get AI analysis
- `GET /api/analytics/risk` - Get risk metrics
- `GET /api/analytics/performance` - Get performance data

### Alerts
- `GET /api/alerts` - Get user alerts
- `POST /api/alerts` - Create alert

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Module Development

Each package and app can be developed independently:

```bash
# Work on types package
cd packages/types
npm run dev

# Work on API
cd apps/api
npm run dev

# Work on MT5 service
cd services/mt5-service
python app.py
```

## Production Deployment

1. **Build all packages**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start services**:
   ```bash
   npm start
   cd services/mt5-service && python app.py
   ```

## Contributing

1. Follow the modular architecture
2. Add types to `packages/types` for shared interfaces
3. Use the shared utilities in `packages/utils`
4. Add comprehensive error handling
5. Include proper TypeScript typing

## License

Private - All rights reserved