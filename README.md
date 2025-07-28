# 📈 TradeInsight
### *Your AI-Driven Trading Analytics Companion*

<div align="center">

![TradeInsight Banner](https://img.shields.io/badge/TradeInsight-AI%20Trading%20Analytics%20Platform-2196F3?style=for-the-badge&logo=chart-line&logoColor=white)

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![MetaTrader5](https://img.shields.io/badge/MetaTrader5-Integration-26A69A?style=flat-square&logo=trading&logoColor=white)](https://www.metatrader5.com/)
[![AI Powered](https://img.shields.io/badge/AI-Transformers.js%20%2B%20OpenAI-FF6B6B?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)

![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=TradeInsight.Platform&left_color=2196F3&right_color=4CAF50&left_text=Visitors)

*Empowering retail traders with AI-driven analytics, real-time risk management, and MT5 integration to address the 70% trader loss rate in volatile markets.*

</div>

---

## 🌟 **Overview**

**TradeInsight** is a web application that integrates with **MetaTrader 5 (MT5)** to fetch historical trade data, logs it locally in **SQLite**, and uses **AI** (Transformers.js or user-provided OpenAI API) to analyze trading activity, habits, and risks, providing personalized strategy suggestions based on the trader's profile. Designed to address the 2024–2025 fintech challenge of retail trader losses (70% lose money due to poor risk management, per Bloomberg, 2024).

### 🎯 **Why TradeInsight?**

- **🤖 AI-Driven Analysis**: Personalized strategy recommendations with explainability
- **📊 MT5 Integration**: Direct data fetching from MetaTrader 5 accounts
- **⚠️ Real-time Alerts**: Risk warnings, drawdown violations, and volatility alerts
- **👥 Social Trading**: Anonymous performance sharing and community insights  
- **🔒 Local Privacy**: SQLite storage with encrypted MT5 credentials
- **📱 Mobile-Optimized**: Responsive design with dark theme
- **🎓 Easy Setup**: Optional Docker deployment for portfolio showcasing

---

## ✨ **Key Features**

### 🏠 **For Traders**
- 📊 **MT5 Data Integration** - Fetch historical trades and price data from your MT5 account
- 🤖 **AI Strategy Recommendations** - Personalized suggestions with clear explanations
- 📈 **Interactive Visualizations** - Chart.js charts with profit/loss, drawdown, and risk metrics
- 🔔 **Real-time Risk Alerts** - In-app and email notifications for dangerous trades
- 👤 **Profile Management** - Update email, password, API key, and MT5 credentials
- 📱 **Mobile-Responsive** - Dark-themed UI optimized for all devices

### 👑 **For Admins/Brokers**
- 🔧 **User Management** - Monitor all traders, trades, and API keys
- 📋 **Risk Settings Control** - Adjust maximum leverage and drawdown limits
- ⚙️ **System Analytics** - Platform-wide performance and usage metrics
- 📊 **Audit Logging** - Track all user actions and rule changes

### 👥 **For Social Trading**
- 🏆 **Anonymous Sharing** - Share performance metrics while maintaining privacy
- 💬 **Community Insights** - View aggregated trading statistics and trends
- 🎯 **Feedback System** - Rate and comment on platform features
- 🏅 **Achievement Badges** - Earn recognition for consistent sharing

---

## 🚀 **Technology Stack**

<div align="center">

### **Frontend Arsenal**
![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.16.4-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4.0-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)

### **Backend Powerhouse**
![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3.43.0-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-5.1.1-FF6B6B?style=for-the-badge&logo=npm&logoColor=white)

### **AI & MT5 Integration**
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.3.2-000000?style=for-the-badge&logo=flask&logoColor=white)
![MetaTrader5](https://img.shields.io/badge/MetaTrader5_Library-Integration-26A69A?style=for-the-badge&logo=trading&logoColor=white)
![Transformers.js](https://img.shields.io/badge/Transformers.js-AI_Models-F16061?style=for-the-badge&logo=huggingface&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)

</div>

---

## ⚡ **Quick Start Guide**

### 🔧 **Prerequisites**
- **MetaTrader 5 terminal** installed locally and connected to a broker account (demo or live)
- **Node.js 18.0+** and npm package manager
- **Python 3.9+** with pip
- **Git** (for cloning)

### 🐳 **Option 1: Docker (Recommended)**

```bash
# 🚀 One-command setup
git clone https://github.com/Yheng/TradeInsight.git
cd TradeInsight
docker-compose up --build

# 🌐 Access your application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Python MT5 Service: http://localhost:5000
```

### 💻 **Option 2: Local Development**

```bash
# 📥 Clone the repository
git clone https://github.com/Yheng/TradeInsight.git
cd TradeInsight

# 📦 Install Frontend Dependencies
cd frontend
npm install react react-dom axios framer-motion react-chartjs-2 chart.js tailwindcss postcss autoprefixer

# 🖥️ Install Backend Dependencies
cd ../backend
npm install express sqlite3 cors dotenv bcrypt jsonwebtoken axios @xenova/transformers

# 🐍 Install Python Dependencies
cd ../python-service
pip install -r requirements.txt

# 🔑 Configure Environment Variables
cd ../backend
cp .env.example .env
# Edit .env with your MT5 credentials (see configuration section)

# 🚀 Start All Services
# Terminal 1: Python MT5 Service
cd python-service && python mt5_service.py

# Terminal 2: Backend API
cd backend && node server.js

# Terminal 3: Frontend
cd frontend && npm run dev

# 🌐 Access URLs
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Python Service: http://localhost:5000
```

### 🔑 **Environment Configuration**

Create `backend/.env` file (add to `.gitignore`):
```env
SQLITE_PATH=./data/db.sqlite
OPENAI_API_KEY=your_openai_key_here
JWT_SECRET=your_jwt_secret_here
MT5_SERVICE_URL=http://localhost:5000
MT5_ACCOUNT=your_mt5_account_id
MT5_PASSWORD=your_mt5_investor_password
MT5_SERVER=your_broker_server
```

### 🎯 **Getting Started After Setup**

Once all services are running, follow these steps:

#### 1. **Create Your Account**
```
📧 Visit: http://localhost:5173
🔐 Click "Register" to create a new trader account
📝 Fill in: Email, Password, Trading Experience Level
✅ Complete the onboarding tutorial
```

#### 2. **Admin Access** (for testing/demo purposes)
```
🛡️ Admin Panel: http://localhost:5173/admin
👑 Default Admin Credentials:
   📧 Email: admin@tradeinsight.local  
   🔑 Password: admin123
⚠️  Change these credentials immediately after first login!
```

#### 3. **Connect Your MT5 Account**
```
⚙️  Navigate to Settings → MT5 Integration
🔐 Enter your MT5 credentials:
   • Account ID (from your broker)  
   • Investor Password (read-only password)
   • Server (broker's server name)
🔄 Test the connection
📊 Start fetching your trade data
```

#### 4. **Explore Key Features**
```
📈 Dashboard: View your trading performance analytics
🤖 AI Analysis: Get personalized strategy recommendations  
🔔 Alerts: Set up risk warnings and notifications
👥 Social: Share performance and view community insights
📊 Charts: Interactive visualizations of your trading data
```

---

## 🏗️ **Project Architecture**

<details>
<summary><b>📁 Project Structure (Click to expand)</b></summary>

```
TradeInsight/
├── 📋 README.md
├── 📚 docs/                        # Documentation
│   ├── 📖 TradeInsight_Summary.markdown
│   ├── 📋 prd.markdown            # Product Requirements Document
│   ├── 🔌 api/                    # API documentation
│   ├── 📖 user-guide/            # User guides
│   └── 🤖 ml-analytics/          # ML documentation
├── 🎨 frontend/                    # React SPA
│   ├── 📦 package.json
│   ├── ⚡ vite.config.js
│   ├── 🎨 tailwind.config.js
│   ├── 🔧 Dockerfile             # Optional Docker
│   └── 📁 src/
│       ├── 🚀 main.jsx           # App entry point
│       ├── 🏠 App.jsx            # Main component
│       ├── 🎨 index.css          # Global styles
│       ├── 🧩 components/        # React components
│       ├── 📄 pages/             # Page components
│       └── 🛠️ utils/             # Frontend utilities
├── 🖥️ backend/                     # Express API Server
│   ├── 📦 package.json
│   ├── 🚀 server.js              # Main server
│   ├── 🔑 .env.example           # Environment template
│   ├── 🔧 Dockerfile             # Optional Docker
│   └── 📁 src/
│       ├── 🗄️ models/            # Database models
│       ├── 🛣️ routes/            # API endpoints
│       ├── 🛡️ middleware/        # Express middleware
│       └── 🛠️ utils/             # Backend utilities
├── 🐍 python-service/             # MT5 Integration Service
│   ├── 🐍 mt5_service.py         # Flask MT5 service
│   ├── 📦 requirements.txt
│   └── 🔧 Dockerfile             # Optional Docker
├── 🔧 docker-compose.yml          # Optional Docker setup
└── 💾 data/                       # SQLite database files
```

</details>

---

## 🔌 **API Documentation**

### 🔐 **Authentication**
All protected endpoints require JWT token:
```http
Authorization: Bearer <your-jwt-token>
```

<details>
<summary><b>👤 Authentication & User Management</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | 📝 Register new trader account |
| `POST` | `/api/auth/login` | 🔐 Secure JWT authentication |
| `GET` | `/api/users/profile` | 👤 Get user profile and preferences |
| `PUT` | `/api/users/profile` | ✏️ Update trading preferences |
| `PUT` | `/api/users/password` | 🔑 Change account password |
| `GET` | `/api/users/onboarding` | 🎓 Get onboarding progress |

</details>

<details>
<summary><b>📊 Trading & Portfolio</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trades` | 📋 Get trade history with filtering |
| `POST` | `/api/trades` | ➕ Create new trade with validation |
| `PUT` | `/api/trades/:id/close` | 🔍 Close trade with P&L |
| `GET` | `/api/portfolio/summary` | ✏️ Portfolio performance metrics |
| `GET` | `/api/portfolio/risk` | 🗑️ Real-time risk assessment |

</details>

<details>
<summary><b>🤖 AI & Machine Learning</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ml/predict/price` | 🔮 AI price predictions |
| `POST` | `/api/ml/analyze/patterns` | 📊 Chart pattern recognition |
| `POST` | `/api/ml/analyze/sentiment` | 📰 News sentiment analysis |
| `POST` | `/api/ml/calculate/risk` | 🎲 Advanced VaR calculations |
| `POST` | `/api/ml/models/retrain` | 🔄 Retrain ML models |
| `GET` | `/api/ml/models/status` | 📈 Model health monitoring |

</details>

<details>
<summary><b>🔔 Alerts & Social Trading</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | 🔔 Get user alerts |
| `POST` | `/api/alerts` | ➕ Create custom alerts |
| `GET` | `/api/alerts/stream` | 📡 Real-time SSE alerts |
| `GET` | `/api/social/leaderboard` | 🏆 Community rankings |
| `GET` | `/api/social/insights` | 💬 Market sentiment |

</details>

---

## 🛡️ **Security Features**

<div align="center">

| 🔒 **Feature** | 📋 **Implementation** |
|----------------|----------------------|
| **Authentication** | JWT with configurable expiration |
| **Encryption** | AES-256-GCM for sensitive data |
| **Password Security** | bcrypt with 12 salt rounds |
| **API Protection** | Rate limiting (100 req/15min) |
| **Input Validation** | Comprehensive sanitization |
| **SQL Injection** | Parameterized queries only |
| **CORS Protection** | Restricted domain access |
| **Security Headers** | Helmet.js integration |

</div>

---

## 🚀 **Advanced Features**

### 🤖 **AI & Machine Learning**
- **Price Predictions**: Multi-model ensemble with LSTM, XGBoost, LightGBM
- **Pattern Recognition**: Automated chart pattern detection
- **Sentiment Analysis**: FinBERT and VADER sentiment processing
- **Risk Modeling**: Monte Carlo simulations and VaR calculations
- **Feature Engineering**: 100+ technical and statistical features

### 🔔 **Real-time System**
- **Sub-second Updates**: Live market data streaming
- **Server-Sent Events**: Real-time alerts and notifications
- **WebSocket Fallback**: Guaranteed connectivity
- **Smart Alerts**: Context-aware risk notifications
- **Emergency Escalation**: Critical alert distribution

### 👥 **Social Trading**
- **Anonymous Sharing**: Privacy-first performance comparison
- **Community Insights**: Aggregate market sentiment
- **Leaderboards**: Multi-metric performance rankings
- **Strategy Discussions**: Knowledge sharing platform

### 📊 **Analytics & Visualization**
- **Interactive Charts**: Chart.js with custom indicators
- **Performance Metrics**: Comprehensive risk-adjusted ratios
- **Export Functionality**: PNG/PDF report generation
- **Mobile Optimization**: Responsive design across devices

---

## 🌐 **Deployment Options**

### 🐳 **Docker Production**
```bash
# 🚀 Production deployment
docker-compose -f docker-compose.prod.yml up -d

# 📊 Monitor services
docker-compose ps
```

### 🔧 **Manual Production**
```bash
# 🏗️ Build all packages
npm run build

# 🐍 Install Python dependencies
pip install -r services/mt5-service/requirements.txt
pip install -r services/ml-analytics/requirements.txt

# 🚀 Start services
npm start &
cd services/mt5-service && python app.py &
cd services/ml-analytics && python app.py &
```

### 🔑 **Environment Configuration**
```env
NODE_ENV=production
JWT_SECRET=your-ultra-secure-jwt-secret
DATABASE_URL=./data/production.db
MT5_LOGIN=your-mt5-login
MT5_PASSWORD=your-mt5-password
MT5_SERVER=your-broker-server
OPENAI_API_KEY=your-openai-key
```

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get involved:

### 🛠️ **Development Workflow**
1. 🍴 Fork the repository
2. 🌿 Create feature branch (`git checkout -b feature/amazing-ai-feature`)
3. 📝 Make documented changes
4. ✅ Add comprehensive tests
5. 🧪 Ensure all tests pass
6. 📤 Submit pull request

### 📋 **Code Standards**
- **TypeScript**: Strict mode enabled with comprehensive typing
- **Documentation**: 80% comment coverage for complex logic
- **Error Handling**: User-friendly error messages
- **Security**: Follow OWASP best practices
- **Performance**: Optimize for speed and memory efficiency
- **Testing**: Unit and integration test coverage

---

## 📄 **License**

This project is licensed under the **GPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Author & Support**

<div align="center">

### **🎨 Created with ❤️ by Ariel Retes**

[![Email](https://img.shields.io/badge/Email-yhengdesigns@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:yhengdesigns@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-Follow%20Me-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Yheng)

### ☕ **Support This Project**

<a href="https://buymeacoffee.com/arielretes" target="_blank">
  <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support%20Development-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
</a>

*If TradeInsight helped you improve your trading performance or inspired your own fintech project, consider buying me a coffee! Your support helps me continue developing innovative trading technology solutions.* ☕✨

</div>

### 💬 **Get Support**

- 🐛 **Bug Reports**: [Create an Issue](https://github.com/Yheng/TradeInsight/issues)
- 💡 **Feature Requests**: [Start a Discussion](https://github.com/Yheng/TradeInsight/discussions)
- 🔒 **Security Issues**: Report privately via email
- 📧 **General Questions**: [yhengdesigns@gmail.com](mailto:yhengdesigns@gmail.com)

---

## 🏆 **Project Highlights**

<div align="center">

This application showcases:

**🏗️ Full-Stack Development** • **📊 MT5 API Integration** • **🛡️ Financial Security**
**🤖 AI Trading Analysis** • **⚡ Real-time Alerts** • **📱 Responsive Design**

*Demonstrates how modern web technologies can solve real fintech challenges faced by retail traders in volatile markets.*

</div>

### 🎯 **Portfolio Benefits**
- **Industry Relevance**: Addresses pressing 2024-2025 fintech challenge (70% trader losses)
- **Technical Breadth**: Full-stack development with Python/Node.js integration
- **AI Integration**: Practical AI implementation with Transformers.js and OpenAI
- **Real-world Application**: Solves actual problems in the $7.5 trillion forex market
- **Deployment Ready**: Docker containerization for easy deployment

---

<div align="center">

### 🌟 **Star this project if it helped you!** 🌟

*TradeInsight: Empowering retail traders with AI-driven insights and risk management.*

### ☕ **Did TradeInsight enhance your trading or development journey?**

**If this project improved your trading performance, helped you learn fintech development, or inspired your own trading tools, consider supporting its continued development:**

<a href="https://buymeacoffee.com/arielretes" target="_blank">
  <img src="https://img.shields.io/badge/☕%20Buy%20Me%20A%20Coffee-Support%20Fintech%20Innovation-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
</a>

*Your contribution helps me dedicate more time to creating impactful fintech solutions that benefit the trading community! 🚀📈*

---

[![GPL-3.0 License](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://choosealicense.com/licenses/gpl-3.0/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/Yheng/TradeInsight)
[![Buy Me A Coffee](https://img.shields.io/badge/☕-Support%20Project-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/arielretes)

</div>