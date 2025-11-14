# System Architecture

## Overview

The Agricultural Risk Mitigation & Early Warning System is built on a modern, scalable microservices-inspired architecture with clear separation of concerns.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Web Browser  │  │ Mobile App   │  │   Kiosk      │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Dashboard   │  │  Map View    │  │  Alerts UI   │              │
│  │  Components  │  │  (Leaflet)   │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Charts      │  │  Forms       │  │  Analytics   │              │
│  │  (Recharts)  │  │              │  │              │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
          │ HTTP/JSON (TanStack Query)
┌─────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER (Node.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Risk API     │  │ Field API    │  │ Alert API    │              │
│  │ Controller   │  │ Controller   │  │ Controller   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────────────────────────────────────────────────┐              │
│  │          Middleware Layer                         │              │
│  │  - Authentication (JWT)                           │              │
│  │  - Error Handling                                 │              │
│  │  - Rate Limiting                                  │              │
│  │  - Request Validation                             │              │
│  └──────────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
          │
┌─────────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Risk Engine  │  │ Gemini AI    │  │ Alerts       │              │
│  │ Service      │  │ Service      │  │ Engine       │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Weather     │  │  Satellite   │  │  Agri Stack  │              │
│  │  Service     │  │  Service     │  │  Service     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │  Market      │  │  Pest        │                                │
│  │  Service     │  │  Service     │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
          │
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ PostgreSQL   │  │    Redis     │  │  File System │              │
│  │  (Prisma)    │  │   (Cache)    │  │   (Logs)     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
          │
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Weather API │  │ Sentinel Hub │  │  Agri Stack  │              │
│  │ OpenWeather  │  │  Satellite   │  │  Govt APIs   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Gemini AI   │  │  Market API  │  │  SMS/Notif   │              │
│  │   Google     │  │  Data.gov.in │  │   Gateways   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Details

### Frontend Architecture

```
src/
├── components/
│   ├── dashboard/        # Dashboard widgets
│   │   ├── RiskCard.tsx
│   │   └── AIInsights.tsx
│   ├── charts/           # Data visualizations
│   │   ├── RiskTrendChart.tsx
│   │   ├── NDVIChart.tsx
│   │   └── WeatherChart.tsx
│   ├── maps/             # Geospatial components
│   │   └── FieldMap.tsx
│   ├── alerts/           # Alert management
│   │   └── AlertsList.tsx
│   └── common/           # Reusable components
├── pages/                # Route pages
│   └── Dashboard.tsx
├── services/             # API clients
│   └── api.ts
├── store/                # State management
│   └── useStore.ts
├── utils/                # Utilities
│   └── risk.ts
└── types/                # TypeScript definitions
    └── index.ts
```

### Backend Architecture

```
src/
├── controllers/          # Route handlers
│   ├── riskController.ts
│   ├── fieldController.ts
│   └── alertController.ts
├── services/             # Business logic
│   ├── riskEngine.ts
│   ├── geminiService.ts
│   ├── weatherService.ts
│   ├── satelliteService.ts
│   ├── agriStackService.ts
│   ├── marketService.ts
│   └── pestService.ts
├── routes/               # API routes
│   ├── riskRoutes.ts
│   ├── fieldRoutes.ts
│   └── alertRoutes.ts
├── middlewares/          # Express middlewares
│   ├── auth.ts
│   └── errorHandler.ts
├── cron/                 # Scheduled jobs
│   └── alertsEngine.ts
├── config/               # Configuration
│   ├── database.ts
│   └── redis.ts
├── utils/                # Utilities
│   ├── logger.ts
│   └── errors.ts
└── index.ts              # Application entry
```

## Data Flow

### Risk Calculation Flow

```
1. Cron Trigger (Daily 6 AM)
   ↓
2. Alerts Engine
   ├→ Fetch all fields from database
   ↓
3. For each field:
   ├→ Risk Engine
   │   ├→ Weather Service → External API → Cache (6h)
   │   ├→ Satellite Service → External API → Cache (12h)
   │   ├→ Pest Service → External API → Cache (24h)
   │   ├→ Market Service → External API → Cache (6h)
   │   └→ Calculate weighted risk score
   ↓
4. Gemini AI Service (for high-risk cases)
   ├→ Generate summary
   ├→ Generate recommendations
   └→ Return analysis
   ↓
5. Save to database
   ├→ RiskScore table
   └→ Update AI analysis
   ↓
6. Alert Generation
   ├→ Check thresholds
   ├→ Create alerts
   └→ Queue notifications
   ↓
7. Send Notifications
   ├→ SMS gateway
   ├→ WhatsApp API
   └→ Push notifications
```

### API Request Flow

```
1. Client Request
   ↓
2. Nginx (HTTPS termination, load balancing)
   ↓
3. Express Server
   ├→ Rate Limiter (100 req/15min)
   ├→ CORS handler
   └→ Body parser
   ↓
4. Authentication Middleware
   ├→ Verify JWT token
   └→ Attach user context
   ↓
5. Route Handler
   ├→ Validate request
   └→ Call controller
   ↓
6. Controller
   ├→ Call service layer
   └→ Format response
   ↓
7. Service Layer
   ├→ Check cache (Redis)
   ├→ Query database (if cache miss)
   ├→ Call external APIs (if needed)
   └→ Update cache
   ↓
8. Response
   ├→ Format as JSON
   ├→ Add headers
   └→ Send to client
```

## Database Schema

### Core Tables

**users**
- Authentication and profile data

**farmer_profile** & **lender_profile**
- Role-specific extended profiles

**fields**
- Land parcels with crop information
- Geographic coordinates

**risk_scores**
- Calculated risk assessments
- AI-generated summaries

**alerts**
- Notifications and warnings
- Delivery status tracking

**weather_data**
- 7-15 day forecasts
- Historical records

**satellite_data**
- NDVI, EVI indices
- Crop health metrics

**soil_data**
- Soil parameters
- Moisture levels

**loans**
- Loan tracking
- Repayment risk

### Relationships

```
User (1) ─→ (1) FarmerProfile
FarmerProfile (1) ─→ (N) Fields
FarmerProfile (1) ─→ (N) Alerts
FarmerProfile (1) ─→ (N) Loans

Field (1) ─→ (N) RiskScores
Field (1) ─→ (N) WeatherData
Field (1) ─→ (N) SatelliteData
Field (1) ─→ (N) SoilData

Lender (1) ─→ (N) Loans
```

## Caching Strategy

### Cache Layers

1. **Redis (Server-side)**
   - Weather data: 6 hours
   - Satellite data: 12 hours
   - Pest advisories: 24 hours
   - Agri Stack data: 24 hours

2. **TanStack Query (Client-side)**
   - Dashboard data: 5 minutes
   - Field data: 5 minutes
   - Alerts: 1 minute

### Cache Invalidation

- Time-based expiration
- Manual invalidation on updates
- Pattern-based deletion for related data

## Security Architecture

### Authentication
- JWT-based authentication
- Token stored in localStorage
- Token expiry: 7 days

### Authorization
- Role-based access control (RBAC)
- Farmer, Lender, Admin roles
- Resource-level permissions

### API Security
- Rate limiting (100 req/15min)
- CORS restrictions
- Input validation (Zod)
- SQL injection prevention (Prisma)
- XSS prevention

### Data Security
- Environment variables for secrets
- Encrypted database connections
- HTTPS only in production

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Load balancer distribution
- Shared Redis cache
- PostgreSQL read replicas

### Vertical Scaling
- Database indexing
- Query optimization
- Connection pooling

### Performance Optimization
- Database query optimization
- Redis caching
- Lazy loading
- Code splitting
- Asset compression
- CDN for static files

## Monitoring & Observability

### Logging
- Winston for structured logging
- Error logs
- Access logs
- Performance logs

### Metrics
- API response times
- Database query times
- Cache hit rates
- External API latency

### Alerts
- System health checks
- Error rate thresholds
- Resource utilization

## Deployment Architecture

### Development
```
localhost:3000 (React Dev Server)
  ↓
localhost:5000 (Node.js Express)
  ↓
localhost:5432 (PostgreSQL)
localhost:6379 (Redis)
```

### Production
```
CDN
  ↓
Load Balancer
  ↓
Nginx (Multiple instances)
  ↓
Node.js App Servers (PM2 cluster)
  ↓
PostgreSQL (Primary + Read Replicas)
Redis (Cluster)
```

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Zustand
- Recharts
- Leaflet

### Backend
- Node.js 18
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Winston
- node-cron

### AI/ML
- Google Gemini 1.5 Pro

### DevOps
- Docker
- Docker Compose
- PM2
- Nginx
- Let's Encrypt
