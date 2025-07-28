# TradeInsight 🚀

**Advanced AI-Powered Trading Analytics Platform with MetaTrader 5 Integration**

TradeInsight is a comprehensive trading analytics platform that combines cutting-edge artificial intelligence with real-time market data to provide traders with powerful insights, risk management tools, and performance analytics. Built with modern web technologies and featuring seamless MetaTrader 5 integration.

---

## 🌟 Key Features

### 🤖 **AI-Driven Analytics**
- **🔮 Price Prediction**: Multi-model ensemble predictions with LSTM, XGBoost, LightGBM, and Random Forest
- **📊 Pattern Recognition**: Automated detection of chart patterns, candlestick formations, and support/resistance levels
- **📰 Sentiment Analysis**: Real-time analysis of news and social media sentiment using FinBERT and VADER
- **🎯 Feature Engineering**: 100+ technical, statistical, and market microstructure features

### 📈 **Advanced Trading Features**
- **⚡ Real-time Market Data**: Live price feeds with sub-second latency
- **🔗 MT5 Integration**: Direct connection to MetaTrader 5 platform
- **📊 Portfolio Management**: Comprehensive trade tracking and performance metrics
- **📱 Mobile-First Design**: Progressive Web App with offline capabilities

### ⚠️ **Risk Management**
- **🎲 Monte Carlo Simulations**: Advanced risk modeling and scenario analysis
- **📈 Value at Risk (VaR)**: Historical, parametric, and Monte Carlo VaR calculations
- **⚖️ Risk Ratios**: Sharpe, Sortino, Calmar, and Information ratios
- **🔔 Real-time Alerts**: SSE-powered risk warnings and drawdown violations

### 👥 **Social Trading**
- **🏆 Community Leaderboards**: Anonymous performance sharing and rankings
- **💬 Market Insights**: Community-driven sentiment and strategy discussions
- **📊 Performance Analytics**: Risk-adjusted return comparisons
- **🔒 Privacy-First**: Complete data anonymization and opt-out controls

### 🛡️ **Security & Compliance**
- **🔐 JWT Authentication**: Secure user management with role-based access
- **♿ WCAG 2.1 AA Compliance**: Full accessibility with ARIA labels and keyboard navigation
- **🌍 Internationalization**: English/Spanish localization with react-i18next
- **🏢 Enterprise Security**: End-to-end encryption and audit logging

## 🏗️ Architecture

TradeInsight is built as a modern, scalable microservices architecture:

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript + SQLite
- **ML Analytics**: Python + Flask + TensorFlow + scikit-learn
- **MT5 Service**: Python + MetaTrader5 library
- **Real-time**: Server-Sent Events (SSE) + WebSocket fallback
- **Deployment**: Docker + Docker Compose ready

### **Project Structure**
```
TradeInsight/
├── packages/              # Shared modules
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Shared utilities and helpers
├── apps/                 # Applications
│   ├── api/              # Backend API server
│   └── web/              # React frontend application
├── services/             # Microservices
│   ├── mt5-service/      # MetaTrader 5 integration service
│   └── ml-analytics/     # Machine Learning analytics service
├── data/                 # Database files and migrations
├── docs/                 # Comprehensive documentation
│   ├── api/              # API documentation
│   ├── user-guide/       # User guide and tutorials
│   └── ml-analytics/     # ML model documentation
└── scripts/              # Development and deployment scripts
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

## 🔌 API Endpoints

### **Authentication & User Management**
- `POST /api/auth/register` - User registration with profile setup
- `POST /api/auth/login` - Secure JWT authentication
- `PUT /api/users/profile` - Update user preferences and risk settings
- `GET /api/users/onboarding` - Get onboarding progress

### **Trading & Portfolio**
- `GET /api/trades` - Get user trades with advanced filtering
- `POST /api/trades` - Create new trade with risk validation
- `PUT /api/trades/:id/close` - Close trade with P&L calculation
- `GET /api/portfolio/summary` - Portfolio performance metrics
- `GET /api/portfolio/risk` - Real-time risk assessment

### **Market Data & MT5 Integration**
- `GET /api/market/symbols/:symbol` - Real-time symbol data
- `GET /api/market/symbols/:symbol/history` - Historical OHLCV data
- `POST /api/mt5/connect` - Connect to MetaTrader 5 account
- `GET /api/mt5/positions` - Live positions from MT5
- `GET /api/mt5/account` - MT5 account information

### **AI & Machine Learning Analytics**
- `POST /api/ml/predict/price` - AI price predictions with confidence intervals
- `POST /api/ml/analyze/patterns` - Chart pattern recognition
- `POST /api/ml/analyze/sentiment` - News and social media sentiment
- `POST /api/ml/calculate/risk` - Advanced risk analytics with VaR
- `POST /api/ml/models/retrain` - Retrain ML models
- `GET /api/ml/models/status` - Model health and performance metrics

### **Alerts & Notifications**
- `GET /api/alerts` - Get user alerts with filtering
- `POST /api/alerts` - Create custom alerts
- `GET /api/alerts/stream` - Server-Sent Events for real-time alerts
- `PUT /api/alerts/:id/acknowledge` - Acknowledge alert

### **Social Trading & Community**
- `GET /api/social/leaderboard` - Community performance rankings
- `GET /api/social/insights` - Market sentiment and community stats
- `POST /api/social/share` - Share anonymized performance
- `GET /api/social/discussions` - Community market discussions

### **Admin Dashboard**
- `GET /api/admin/users` - User management (admin only)
- `GET /api/admin/analytics` - Platform analytics
- `PUT /api/admin/settings` - System configuration
- `GET /api/admin/monitoring` - System health monitoring

## 📚 Documentation

### **Complete Documentation Suite**
- **📖 [User Guide](./docs/user-guide/README.md)** - Comprehensive guide for traders and users
- **🔌 [API Documentation](./docs/api/README.md)** - Complete API reference with examples
- **🤖 [ML Analytics Guide](./docs/ml-analytics/README.md)** - Detailed ML model documentation
- **🏗️ [Architecture Overview](./docs/README.md)** - Technical architecture and design decisions

### **Quick Links**
- **🚀 Getting Started**: Follow the user guide for step-by-step setup
- **🔑 Authentication**: JWT-based secure authentication system
- **📊 Trading Features**: Portfolio management and trade analytics
- **🤖 AI Integration**: Machine learning model usage and interpretation
- **⚠️ Risk Management**: VaR calculations and scenario analysis

## 🛠️ Development

### **Building & Testing**
```bash
# Build all packages
npm run build

# Run comprehensive tests
npm run test

# Lint and format code
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

### **Development Workflow**
```bash
# Start development environment
npm run dev

# Watch mode for types
cd packages/types && npm run dev

# ML service development
cd services/ml-analytics && python app.py

# Run health checks
npm run health
```

### **Module Development**
Each package and service can be developed independently:

```bash
# Frontend development
cd apps/web && npm run dev

# Backend API development
cd apps/api && npm run dev

# MT5 service development
cd services/mt5-service && python app.py

# ML analytics service
cd services/ml-analytics && python app.py
```

## 🚀 Production Deployment

### **Docker Deployment (Recommended)**
```bash
# Build and start with Docker Compose
docker-compose up --build -d

# Check service health
docker-compose ps
```

### **Manual Deployment**
```bash
# 1. Build all packages
npm run build

# 2. Set production environment variables
cp .env.example .env.production
# Edit .env.production with your production settings

# 3. Install Python dependencies
pip install -r services/mt5-service/requirements.txt
pip install -r services/ml-analytics/requirements.txt

# 4. Start services
npm start &
cd services/mt5-service && python app.py &
cd services/ml-analytics && python app.py &
```

### **Environment Variables**
```bash
# Core Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=./data/production.db

# MT5 Integration
MT5_LOGIN=your-mt5-login
MT5_PASSWORD=your-mt5-password
MT5_SERVER=your-broker-server

# AI/ML Configuration
OPENAI_API_KEY=your-openai-key (optional)
ML_MODEL_PATH=./services/ml-analytics/saved_models
```

## 📊 Performance & Monitoring

### **Key Metrics**
- **Response Time**: < 100ms for API calls
- **ML Inference**: < 500ms for predictions
- **Real-time Updates**: < 50ms latency via SSE
- **Uptime**: 99.9% availability target

### **Monitoring Endpoints**
- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics` 
- **ML Model Status**: `GET /api/ml/models/status`
- **System Resources**: `GET /api/admin/monitoring`

## 🤝 Contributing

### **Development Guidelines**
1. **Follow the modular architecture** - Keep services loosely coupled
2. **Type Safety** - Add TypeScript types to `packages/types`
3. **Shared Utilities** - Use utilities in `packages/utils`
4. **Error Handling** - Implement comprehensive error handling
5. **Testing** - Write unit and integration tests
6. **Documentation** - Update relevant documentation

### **Code Standards**
- **ESLint + Prettier** for code formatting
- **TypeScript strict mode** enabled
- **Conventional Commits** for commit messages
- **Jest** for testing JavaScript/TypeScript
- **pytest** for testing Python services

### **Pull Request Process**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper tests
4. Run the full test suite (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🔒 Security & Privacy

- **🔐 End-to-end Encryption**: All sensitive data encrypted in transit and at rest
- **🛡️ JWT Authentication**: Secure token-based authentication
- **♿ WCAG 2.1 AA Compliance**: Full accessibility support
- **🔍 Security Auditing**: Regular security audits and penetration testing
- **📊 Data Anonymization**: Complete anonymization for social trading features
- **🌍 GDPR Compliant**: Full compliance with data protection regulations

## 📞 Support & Community

### **Getting Help**
- **📧 Email**: support@tradeinsight.com
- **💬 Live Chat**: Available 24/5 during market hours
- **📖 Documentation**: Comprehensive guides and API references
- **🎥 Video Tutorials**: Step-by-step video guides

### **Community**
- **💬 Discord**: Join our trading community
- **📚 Knowledge Base**: Extensive FAQ and troubleshooting
- **🎓 Webinars**: Regular educational webinars
- **📊 Blog**: Trading insights and platform updates

## 📄 License

**Private - All Rights Reserved**

This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 🎯 What's Next?

- **🔮 Advanced AI Models**: Enhanced prediction accuracy with transformer models
- **📱 Mobile Apps**: Native iOS and Android applications
- **🌍 Multi-Language**: Support for more languages and regions
- **🏢 Enterprise Features**: Advanced compliance and reporting tools
- **🔗 More Brokers**: Integration with additional trading platforms

---

**Ready to revolutionize your trading with AI?** [Get started now →](./docs/user-guide/README.md)