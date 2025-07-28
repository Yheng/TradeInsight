# 💊 PillPulse
### *Your Smart Medication Adherence Companion*

<div align="center">

![PillPulse Banner](https://img.shields.io/badge/PillPulse-Medication%20Adherence%20Platform-blue?style=for-the-badge&logo=medical-cross&logoColor=white)

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.0+-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![AI Powered](https://img.shields.io/badge/AI-Powered-FF6B6B?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)

![Visitor Count](https://visitor-badge.laobi.icu/badge?page_id=Yheng.PillPulse&left_color=red&right_color=green&left_text=Visitors)

*Empowering chronic illness patients with intelligent medication tracking, AI-powered reminders, and comprehensive adherence analytics.*

</div>

---

## 🌟 **Overview**

**PillPulse** is a cutting-edge, full-stack web application designed specifically for chronic illness patients who need reliable medication adherence tracking. Built with modern technologies and AI integration, it transforms the way patients manage their medication routines through intelligent reminders, comprehensive analytics, and seamless user experience.

### 🎯 **Why PillPulse?**

- **🤖 AI-Powered Intelligence**: Personalized reminders and coaching messages
- **📊 Advanced Analytics**: Interactive charts and adherence insights
- **⏰ Precise Timing**: Minute-accurate notification system
- **👥 Caregiver Support**: Shared access and emergency alerts
- **🔒 Privacy-First**: Local processing, secure encryption
- **📱 Responsive Design**: Perfect on desktop and mobile
- **🎓 User-Friendly**: Comprehensive onboarding tutorial

---

## ✨ **Key Features**

### 🏠 **For Patients**
- 📅 **Smart Schedule Management** - Add, edit, and organize medication schedules with ease
- 🔔 **AI-Powered Reminders** - Personalized notifications at exact scheduled times
- 📈 **Adherence Analytics** - Visual insights with interactive charts and trends
- 🏆 **Streak Tracking** - Gamified adherence with motivation badges
- 📚 **Educational Content** - AI-generated medication information and tips
- 🔄 **Multiple Snooze Options** - 5, 10, 15, 30, 60-minute flexibility
- 🌍 **Timezone Support** - Accurate timing across different time zones

### 👨‍⚕️ **For Caregivers**
- 👥 **Patient Oversight** - Monitor multiple patients' medication adherence
- 🚨 **Emergency Alerts** - Instant notifications for critical missed doses
- 📊 **Comprehensive Reports** - Detailed adherence analytics and trends
- 💬 **Invitation System** - Secure patient-caregiver connections
- 📞 **Emergency Contacts** - Automated alerts to designated contacts

### 🛡️ **For Administrators**
- 🔧 **User Management** - Complete user account oversight
- 📋 **System Monitoring** - Platform-wide usage and adherence metrics
- ⚙️ **Settings Control** - Configure system-wide reminder preferences
- 📊 **Analytics Dashboard** - Comprehensive system statistics

---

## 🚀 **Technology Stack**

<div align="center">

### **Frontend Arsenal**
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-4.4.5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.16.4-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### **Backend Powerhouse**
![Node.js](https://img.shields.io/badge/Node.js-18.17.0-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3.43.0-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### **AI & Security**
![OpenAI](https://img.shields.io/badge/OpenAI-4.24.1-412991?style=for-the-badge&logo=openai&logoColor=white)
![bcrypt](https://img.shields.io/badge/bcrypt-5.1.1-FF6B6B?style=for-the-badge&logo=npm&logoColor=white)
![AES-256](https://img.shields.io/badge/AES--256-Encryption-4CAF50?style=for-the-badge&logo=security&logoColor=white)

</div>

---

## ⚡ **Quick Start Guide**

### 🔧 **Prerequisites**
- Node.js 18.0+ 
- npm or yarn package manager
- Git (for cloning)

### 🐳 **Option 1: Docker (Recommended)**

```bash
# 🚀 One-command setup
git clone https://github.com/Yheng/PillPulse.git
cd PillPulse
docker-compose up -d

# 🌐 Access your application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### 💻 **Option 2: Local Development**

```bash
# 📥 Clone the repository
git clone https://github.com/Yheng/PillPulse.git
cd PillPulse

# 📦 Install all dependencies
npm run install:all

# 🔑 Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# ✏️ Edit .env files with your configuration
# Minimum required: JWT_SECRET and ENCRYPTION_KEY

# 🚀 Start development servers
npm run dev

# 🌐 Access your application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000
# Health Check: http://localhost:3000/api/health
```

### 👑 **Default Admin Access**
```
📧 Email: admin@pillpulse.local
🔑 Password: admin123
⚠️ Change these credentials immediately after first login!
```

---

## 🏗️ **Project Architecture**

<details>
<summary><b>📁 Project Structure (Click to expand)</b></summary>

```
PillPulse/
├── 📋 README.md
├── 📦 package.json                 # Workspace configuration
├── 📚 architecture.markdown        # System architecture docs
├── 🎨 frontend/                    # React SPA
│   ├── 📦 package.json
│   ├── ⚡ vite.config.js
│   ├── 🎨 tailwind.config.js
│   └── 📁 src/
│       ├── 🚀 main.jsx            # App entry point
│       ├── 🏠 App.jsx             # Main component
│       ├── 🎨 index.css           # Global styles
│       ├── 🧩 components/         # Reusable components
│       │   ├── 🧭 Navbar.jsx
│       │   ├── 🤖 AIFeatures.jsx
│       │   ├── 🎓 OnboardingTutorial.jsx
│       │   └── ❓ ContextualHelp.jsx
│       ├── 📄 pages/              # Page components
│       │   ├── 🏠 UserDashboard.jsx
│       │   ├── 📊 AnalyticsPage.jsx
│       │   ├── 🔐 LoginPage.jsx
│       │   └── ⚙️ SettingsPage.jsx
│       ├── 🌐 context/            # State management
│       │   ├── 👤 AuthContext.jsx
│       │   ├── 📅 ScheduleContext.jsx
│       │   └── 🎓 OnboardingContext.jsx
│       └── 🛠️ utils/              # Utilities
├── 🖥️ backend/                     # Express API Server
│   ├── 📦 package.json
│   ├── 🚀 server.js               # Main server
│   ├── 🔑 .env.example            # Environment template
│   └── 📁 src/
│       ├── 🗄️ models/
│       │   └── 📊 database.js     # SQLite setup
│       ├── 🛣️ routes/             # API endpoints
│       │   ├── 👤 userRoutes.js
│       │   ├── 📅 scheduleRoutes.js
│       │   ├── 📈 adherenceRoutes.js
│       │   ├── 📊 analyticsRoutes.js
│       │   ├── 👥 caregiverRoutes.js
│       │   └── 👑 adminRoutes.js
│       ├── 🛡️ middleware/         # Express middleware
│       │   ├── 🔐 auth.js
│       │   ├── ❌ errorHandler.js
│       │   └── 📝 requestLogger.js
│       ├── 🛠️ utils/              # Backend utilities
│       │   ├── 🔒 encryption.js
│       │   ├── 🔔 notificationService.js
│       │   └── 🤖 openaiService.js
│       └── 🚨 services/           # Business logic
│           └── ⚠️ emergencyAlertService.js
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
<summary><b>👤 User Endpoints</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/register` | 📝 Register new user |
| `POST` | `/api/users/login` | 🔐 User authentication |
| `GET` | `/api/users/profile` | 👤 Get user profile |
| `PUT` | `/api/users/profile` | ✏️ Update user profile |
| `PUT` | `/api/users/password` | 🔑 Change password |
| `PUT` | `/api/users/api-key` | 🤖 Update OpenAI API key |

</details>

<details>
<summary><b>📅 Schedule Endpoints</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/schedules` | 📋 List user schedules |
| `POST` | `/api/schedules` | ➕ Create new schedule |
| `GET` | `/api/schedules/:id` | 🔍 Get specific schedule |
| `PUT` | `/api/schedules/:id` | ✏️ Update schedule |
| `DELETE` | `/api/schedules/:id` | 🗑️ Delete schedule |
| `GET` | `/api/schedules/today` | 📅 Get today's schedules |

</details>

<details>
<summary><b>📊 Analytics Endpoints</b></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics` | 📈 Comprehensive analytics |
| `GET` | `/api/analytics/streak` | 🏆 Adherence streak data |
| `GET` | `/api/analytics/export/:type` | 📁 Export chart as PNG |

</details>

---

## 🛡️ **Security Features**

<div align="center">

| 🔒 **Feature** | 📋 **Implementation** |
|----------------|----------------------|
| **Password Security** | bcrypt with 12 salt rounds |
| **API Key Protection** | AES-256-GCM encryption |
| **Authentication** | JWT with configurable expiration |
| **Input Validation** | express-validator sanitization |
| **SQL Injection** | Parameterized queries |
| **Rate Limiting** | 100 requests/15min per IP |
| **CORS Protection** | Restricted to frontend domain |
| **Security Headers** | Helmet.js integration |

</div>

---

## 🚀 **Advanced Features**

### 🤖 **AI Integration**
- **Personalized Reminders**: Context-aware medication prompts
- **Smart Coaching**: Adaptive motivational messages
- **Educational Content**: Medication information and tips
- **Adherence Insights**: AI-powered improvement suggestions

### 🔔 **Notification System**
- **Precise Timing**: Minute-accurate reminder delivery
- **Multiple Channels**: Web push, email, SMS support
- **Escalation Patterns**: Progressive reminder intensity
- **Snooze Options**: Flexible delay choices (5-60 minutes)
- **Emergency Alerts**: Critical dose miss notifications

### 👥 **Caregiver Features**
- **Invitation System**: Secure patient-caregiver linking
- **Multi-Patient Dashboard**: Centralized monitoring
- **Emergency Contacts**: Automated alert distribution
- **Access Levels**: Granular permission control

### 📊 **Analytics & Insights**
- **Interactive Charts**: Chart.js visualizations
- **Trend Analysis**: Long-term adherence patterns
- **Export Functionality**: PNG chart downloads
- **Streak Tracking**: Gamified consistency rewards

---

## 📸 **Screenshots**

<div align="center">
<table>
<tr>
<td align="center" width="50%">
<img src="images/login.jpeg" alt="Login Page" width="100%"/>
<b>Login Page</b>
</td>
<td align="center" width="50%">
<img src="images/dashboard.jpeg" alt="Dashboard" width="100%"/>
<b>Dashboard</b>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="images/add-medication.jpeg" alt="Add Medication" width="100%"/>
<b>Add Medication</b>
</td>
<td align="center" width="50%">
<img src="images/schedules.jpeg" alt="Schedules" width="100%"/>
<b>Schedules</b>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="images/notification.jpeg" alt="Notifications" width="100%"/>
<b>Notifications</b>
</td>
<td align="center" width="50%">
<img src="images/analytics.jpeg" alt="Analytics" width="100%"/>
<b>Analytics</b>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="images/settings-profile.jpeg" alt="Settings - Profile" width="100%"/>
<b>Settings - Profile</b>
</td>
<td align="center" width="50%">
<img src="images/settings-api.jpeg" alt="Settings - API" width="100%"/>
<b>Settings - API</b>
</td>
</tr>
<tr>
<td align="center" width="50%">
<img src="images/settings-notification.jpeg" alt="Settings - Notifications" width="100%"/>
<b>Settings - Notifications</b>
</td>
<td align="center" width="50%">
<img src="images/settings-caregiver.jpeg" alt="Settings - Caregiver" width="100%"/>
<b>Settings - Caregiver</b>
</td>
</tr>
</table>
</div>

---

## 🌐 **Deployment Options**

### 🐳 **Docker Production**
```bash
# 🚀 Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### 🔧 **Manual Production**
```bash
# 🏗️ Build frontend
npm run build

# 🚀 Start backend
cd backend
NODE_ENV=production npm start
```

### 🔑 **Environment Configuration**
```env
NODE_ENV=production
JWT_SECRET=your-ultra-secure-jwt-secret
ENCRYPTION_KEY=your-32-byte-hex-encryption-key
FRONTEND_URL=https://your-domain.com
RATE_LIMIT_MAX=100
```

---

## 🤝 **Contributing**

We welcome contributions! Here's how to get involved:

### 🛠️ **Development Workflow**
1. 🍴 Fork the repository
2. 🌿 Create feature branch (`git checkout -b feature/amazing-feature`)
3. 📝 Make documented changes
4. ✅ Add comprehensive tests
5. 🧪 Ensure all tests pass
6. 📤 Submit pull request

### 📋 **Code Standards**
- **Documentation**: 80% comment coverage
- **Error Handling**: Comprehensive user-friendly messages
- **Validation**: Frontend + backend input validation
- **Security**: Follow industry best practices
- **Performance**: Optimize for speed and memory

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 **Author & Support**

<div align="center">

### **🎨 Created with ❤️ by Ariel Retes**

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit%20My%20Site-FF6B6B?style=for-the-badge&logo=web&logoColor=white)](https://coff.ee/arielretes)
[![Email](https://img.shields.io/badge/Email-yhengdesigns@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:yhengdesigns@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-Follow%20Me-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Yheng)

### ☕ **Support This Project**

<a href="https://www.buymeacoffee.com/arielretes" target="_blank">
  <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support%20Development-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
</a>

*If PillPulse helped you manage your medications better or inspired your own project, consider buying me a coffee! Your support helps me continue developing innovative healthcare solutions.* ☕✨

</div>

### 💬 **Get Support**

- 🐛 **Bug Reports**: [Create an Issue](https://github.com/Yheng/PillPulse/issues)
- 💡 **Feature Requests**: [Start a Discussion](https://github.com/Yheng/PillPulse/discussions)
- 🔒 **Security Issues**: Report privately via email
- 📧 **General Questions**: [yhengdesigns@gmail.com](mailto:yhengdesigns@gmail.com)

---

## 🏆 **Project Highlights**

<div align="center">

This application showcases:

**🏗️ Full-Stack Mastery** • **🏥 Healthcare Technology** • **🛡️ Security Excellence**
**📊 Data Visualization** • **🤖 AI Integration** • **📱 Responsive Design**

*Highlights how innovative technical solutions can make a meaningful impact in healthcare delivery.*

</div>

---

<div align="center">

### 🌟 **Star this project if it helped you!** 🌟

*PillPulse: Transforming medication adherence, one dose at a time.*

### ☕ **Did PillPulse help you or your loved ones?**

**If this project saved you time, improved your health routine, or served as inspiration for your own work, consider supporting its continued development:**

<a href="https://www.buymeacoffee.com/arielretes" target="_blank">
  <img src="https://img.shields.io/badge/☕%20Buy%20Me%20A%20Coffee-Support%20Healthcare%20Innovation-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
</a>

*Your contribution helps me dedicate more time to creating impactful healthcare technology solutions! 🚀💊*

---

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg)](https://github.com/Yheng/PillPulse)
[![Buy Me A Coffee](https://img.shields.io/badge/☕-Support%20Project-FFDD00?style=flat-square&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/arielretes)

</div>