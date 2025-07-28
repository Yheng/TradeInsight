# TradeInsight - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Python 3.8+ with MetaTrader5 package
- MT5 terminal installed (for real trading data)

### Installation
```bash
# Clone and install dependencies
npm install

# Build the project
npm run build

# Start all services in development
npm run dev
```

### Service Endpoints
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **MT5 Service**: http://localhost:5001
- **Health Check**: http://localhost:3000/health

## 🏗️ Architecture

### Backend (apps/api)
- **Framework**: Node.js + Express + TypeScript
- **Database**: SQLite with comprehensive schema
- **Authentication**: JWT tokens
- **Real-time**: Server-Sent Events for alerts

### Frontend (apps/frontend)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **State**: React Query + Zustand
- **UI**: Dark theme with professional trading aesthetics

### MT5 Service (services/mt5-service)
- **Framework**: Python Flask
- **Integration**: MetaTrader5 API
- **Features**: Real-time data, trade execution, account management

## 📋 Feature Overview

### ✅ Implemented Features

1. **Dashboard**
   - Real-time portfolio overview
   - Key metrics visualization
   - Quick action panels

2. **Trading Interface**
   - MT5 account connection
   - Live market data
   - Trade execution and history

3. **Analytics**
   - Performance metrics
   - Risk analysis
   - Trade statistics with charts

4. **AI Analysis**
   - Transformers.js integration
   - Rule-based trading recommendations
   - Symbol-specific insights

5. **Alert System**
   - Real-time price/profit/risk alerts
   - Server-Sent Events delivery
   - Customizable alert conditions

6. **Admin Dashboard**
   - User management with bulk operations
   - Platform analytics
   - Risk profile management
   - Data export (CSV/JSON)

7. **Social Trading**
   - Anonymized community metrics
   - Leaderboards (win rate, profit, volume)
   - Achievement badges system
   - Privacy-controlled sharing

### 🔧 Technical Features

- **Authentication**: JWT-based with role management
- **Database**: SQLite with 15+ tables covering all features
- **Real-time**: SSE for alerts, periodic metric updates
- **Security**: Helmet, CORS, rate limiting
- **Type Safety**: Full TypeScript coverage
- **Monorepo**: Workspace-based architecture

## 🔒 Security & Privacy

- All trading data anonymized in social features
- User-controlled privacy settings
- Secure JWT token management
- Input validation and sanitization
- Rate limiting protection

## 📊 Database Schema

Key tables include:
- `users` - User accounts and authentication
- `trades` - Trading history and performance
- `user_risk_profiles` - Risk management settings
- `alerts` - User-defined alert conditions
- `social_metrics` - Anonymized sharing data
- `audit_logs` - System activity tracking

## 🚀 Deployment Options

### Development
```bash
npm run dev  # Starts all services
```

### Production Build
```bash
npm run build  # Builds all workspaces
```

### Docker (Optional Enhancement)
- Frontend: Nginx + built React app
- API: Node.js container
- MT5 Service: Python container
- Database: SQLite volume

## 📈 Performance

- **Frontend**: ~542KB bundled (with code splitting opportunities)
- **API**: TypeScript compiled for optimal performance
- **Database**: SQLite with indexed queries
- **Real-time**: Efficient SSE connections

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_PATH=./database.sqlite
FRONTEND_URL=http://localhost:5173

# MT5 Service
MT5_SERVICE_PORT=5001
MT5_SERVER=your-mt5-server
MT5_LOGIN=your-login
MT5_PASSWORD=your-password
```

### Frontend Configuration
- Built with Vite for fast development
- Tailwind CSS for styling
- React Query for data fetching
- Framer Motion for animations

## 🧪 Testing

The project is ready for testing implementation:
- Unit tests: Jest + React Testing Library
- Integration tests: Supertest for API
- E2E tests: Cypress for full workflows

## 📦 Next Steps

Priority enhancements:
1. **Testing Suite** - Comprehensive test coverage
2. **CI/CD Pipeline** - Automated deployment
3. **Performance Monitoring** - Observability tools
4. **Advanced Charts** - TradingView integration
5. **Mobile PWA** - Enhanced mobile experience

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Trading
- `GET /api/mt5/account` - Account information
- `GET /api/trades` - Trading history
- `POST /api/alerts` - Create alerts

### Social
- `GET /api/social/community/metrics` - Community insights
- `GET /api/social/leaderboard` - Rankings
- `GET /api/social/badges` - User achievements

### Admin
- `GET /api/admin/users` - User management
- `GET /api/admin/analytics` - Platform metrics
- `POST /api/admin/users/bulk-risk-update` - Bulk operations

## 🎯 Success Metrics

The platform successfully implements all requirements from the PRD:
- ✅ MT5 data integration with real-time capabilities
- ✅ AI-driven analysis with fallback systems
- ✅ Comprehensive alert management
- ✅ Administrative oversight and control
- ✅ Social trading with privacy protection
- ✅ Professional UI/UX with dark theme
- ✅ Scalable monorepo architecture
- ✅ Type-safe development environment

Ready for production deployment! 🚀