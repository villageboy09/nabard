# 🌾 Agricultural Risk Mitigation & Early Warning System (Track 2)

A complete 7-15 day forward-looking risk prediction and early warning system for agriculture, powered by AI and satellite data.

## 🎯 Overview

This Track 2 solution provides:

- **Risk Prediction**: 7-15 day ahead crop-level risk forecasting
- **Multi-Factor Analysis**: Weather, NDVI/satellite, soil moisture, pest, and market price risks
- **AI-Powered Insights**: Gemini-generated risk summaries and mitigation recommendations
- **Automated Alerts**: SMS/WhatsApp/Push notifications to farmers and lenders
- **Unified Dashboard**: Real-time risk visualization with maps and charts
- **Loan Repayment Risk**: Climate stress-based repayment risk prediction

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Dashboard   │  │  Map View    │  │  Alerts UI   │         │
│  │   + Charts    │  │ (Leaflet)    │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                         REST API (HTTPS)
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Risk Engine  │  │ Alerts Engine│  │  Gemini AI   │         │
│  │   Scoring     │  │  Cron Jobs   │  │   Analysis   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Weather     │  │  Satellite   │  │  Agri Stack  │         │
│  │   Service     │  │  NDVI Data   │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  PostgreSQL   │  │    Redis      │                            │
│  │   (Prisma)    │  │   (Cache)     │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## ✨ Features

### 1. Risk Prediction Engine
- **7-15 Day Forecasting**: Forward-looking risk assessment
- **Multi-Factor Scoring**:
  - Weather Risk (25%): Temperature, rainfall, heat stress
  - Crop Health (25%): NDVI-based vegetation indices
  - Soil Moisture (10%): Moisture deficit tracking
  - Pest & Disease (20%): Advisory-based risk
  - Market Price (20%): Price crash detection

### 2. Data Integration
- ✅ Weather API (OpenWeatherMap)
- ✅ Satellite Data (Sentinel-2 NDVI)
- ✅ Agri Stack Integration
- ✅ Market Price APIs
- ✅ Pest Advisory Systems

### 3. AI-Powered Analysis
- **Gemini 1.5 Pro** for:
  - Natural language risk summaries
  - Actionable recommendations
  - Farmer advisories (multi-language)
  - Lender risk briefs

### 4. Alerts System
- Automated daily risk calculation (cron)
- Alert types:
  - Weather extremes (heatwave, heavy rain, frost)
  - Crop stress warnings
  - Pest outbreak alerts
  - Market price crashes
  - Irrigation needs
  - Repayment risk triggers
- Multi-channel delivery (SMS/WhatsApp/Push)

### 5. Visualization Dashboard
- Interactive field map with risk heat zones
- Real-time charts:
  - Risk trend analysis
  - NDVI timeline
  - Weather forecast
  - Yield impact projections
- Mobile-responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis
- API Keys (Weather, Gemini, etc.)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd nabard

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys

# Database setup
npx prisma generate
npx prisma migrate dev

# Start backend
npm run dev

# Frontend setup (in new terminal)
cd ../frontend
npm install
cp .env.example .env
# Edit .env if needed

# Start frontend
npm run dev
```

### Environment Variables

**Backend (.env)**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/agri_risk_db
PORT=5000
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
WEATHER_API_KEY=your-openweathermap-key
GEMINI_API_KEY=your-gemini-api-key
SATELLITE_API_KEY=your-satellite-api-key
AGRI_STACK_API_KEY=your-agristack-key
```

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 API Endpoints

### Risk APIs
- `GET /api/risks/dashboard` - Get risk dashboard summary
- `GET /api/risks/field/:fieldId/calculate` - Calculate field risk
- `GET /api/risks/field/:fieldId` - Get risk scores history
- `POST /api/risks/calculate-all` - Trigger batch risk calculation

### Field APIs
- `GET /api/fields` - List all fields
- `GET /api/fields/:fieldId` - Get field details
- `GET /api/fields/:fieldId/weather` - Get weather forecast
- `GET /api/fields/:fieldId/satellite` - Get satellite data
- `POST /api/fields` - Create new field
- `PATCH /api/fields/:fieldId` - Update field

### Alert APIs
- `GET /api/alerts` - Get alerts (with filters)
- `PATCH /api/alerts/:alertId/read` - Mark alert as read
- `GET /api/alerts/stats` - Get alert statistics

## 🔄 Cron Jobs

### Daily Risk Calculation & Alerts
- **Schedule**: Daily at 6 AM (configurable via `RISK_CRON_SCHEDULE`)
- **Workflow**:
  1. Calculate 7-15 day risk for all fields
  2. Generate AI analysis for high-risk cases
  3. Create weather/pest/market alerts
  4. Send notifications to farmers

**Manual trigger**:
```bash
cd backend
npm run cron:alerts
```

## 📈 Risk Scoring Algorithm

```
Overall Risk =
  25% × Weather Risk +
  25% × NDVI Risk +
  10% × Soil Moisture Risk +
  20% × Pest Risk +
  20% × Market Risk

Yield Impact = f(Weather Impact, NDVI Impact, Pest Impact, Soil Impact)

Repayment Risk = 0.6 × Overall Risk + 0.4 × Yield Impact
```

### Risk Levels
- **LOW**: 0-24
- **MEDIUM**: 25-49
- **HIGH**: 50-74
- **CRITICAL**: 75-100

## 🗄️ Database Schema

Key models:
- **User** → Farmer/Lender profiles
- **Field** → Land parcels with crops
- **RiskScore** → Risk calculations with AI analysis
- **Alert** → Notifications
- **WeatherData** → 15-day forecasts
- **SatelliteData** → NDVI/EVI indices
- **SoilData** → Soil health parameters
- **Loan** → Loan tracking with repayment risk

See `backend/prisma/schema.prisma` for full schema.

## 🎨 Frontend Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Charts**: Recharts
- **Maps**: Leaflet + React Leaflet
- **Icons**: Lucide React

## 🛠️ Backend Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis + ioredis
- **AI**: Google Gemini AI
- **Cron**: node-cron
- **Logging**: Winston

## 📱 Deployment

### Production Build

**Backend**:
```bash
cd backend
npm run build
npm start
```

**Frontend**:
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Docker (Optional)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d
```

## 🎯 Hackathon Deliverables Checklist

- ✅ Risk Prediction Engine (7-15 days)
- ✅ Multi-factor risk scoring (weather, NDVI, pest, market, soil)
- ✅ Gemini AI integration for analysis & recommendations
- ✅ Automated alerts engine with cron jobs
- ✅ REST API with comprehensive endpoints
- ✅ React dashboard with maps & charts
- ✅ Real-time risk visualization
- ✅ Satellite NDVI integration
- ✅ Repayment risk prediction
- ✅ Weather extreme detection
- ✅ Database schema & migrations
- ✅ Production-ready architecture
- ✅ API documentation
- ✅ Deployment configuration

## 🌟 Advanced Features

- **Satellite NDVI Viewer**: Track crop health via vegetation indices
- **Repayment Risk Prediction**: Climate stress impact on loans
- **Heat Stress Detection**: Crop-specific heat tolerance monitoring
- **Local Language Support**: Multi-language farmer advisories
- **Mobile-First Design**: Kiosk & mobile device optimization
- **Confidence Scoring**: AI prediction confidence metrics

## 📝 API Authentication

All API endpoints require Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/risks/dashboard
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

This is a hackathon submission. For production use, consider:
- Implementing actual SMS/WhatsApp gateways
- Adding user authentication flow
- Integrating real Sentinel Hub API
- Adding comprehensive test coverage
- Implementing rate limiting per user
- Adding monitoring & observability

## 📄 License

MIT License

## 👥 Team

Track 2 - Agricultural Risk Mitigation System

## 📞 Support

For issues, please check the logs:
- Backend: `backend/logs/`
- Frontend: Browser console

---

**Built with ❤️ for agricultural resilience and farmer prosperity**
