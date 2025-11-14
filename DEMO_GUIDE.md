# 🎮 Demo Guide - Agricultural Risk Mitigation System

This guide will help you quickly set up and explore the complete Track 2 solution with pre-populated demo data.

## 🚀 Quick Start (1 Minute Setup)

### Option 1: Automated Demo Script (Recommended)

```bash
# Make script executable
chmod +x demo-start.sh

# Run the demo
./demo-start.sh
```

The script will:
1. ✅ Create demo database
2. ✅ Install dependencies
3. ✅ Run migrations
4. ✅ Seed with realistic data
5. ✅ Start backend and frontend

### Option 2: Manual Setup

```bash
# Backend
cd backend
cp .env.demo .env
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## 🌐 Access the System

Once started:

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/

## 🔑 Demo Credentials

### Farmer Accounts

**Farmer 1 - Rajesh Kumar** (Cotton & Soybean)
```
Email: farmer1@demo.com
Password: demo123
Location: Wardha, Maharashtra
Fields: 2 fields (Cotton + Soybean)
Risk Status: Medium to High
```

**Farmer 2 - Priya Devi** (Rice)
```
Email: farmer2@demo.com
Password: demo123
Location: Yavatmal, Maharashtra
Fields: 1 field (Rice)
Risk Status: Low
```

### Lender Account

**NABARD Regional Office**
```
Email: lender@demo.com
Password: demo123
Institution: NABARD Maharashtra
Portfolio: 2 active loans
```

## 📊 Pre-loaded Demo Data

The demo system includes:

### Fields & Crops
- **3 fields** across 2 farmers
- **3 different crops**: Cotton, Soybean, Rice
- Geographic locations in Maharashtra
- Complete crop lifecycle data

### Risk Assessments
- **7-day risk forecasts** for all fields
- **AI-generated insights** from Gemini
- Risk scores calculated using real algorithms
- Yield impact and repayment risk predictions

### Weather Data
- **15-day forecasts** for all field locations
- Historical weather patterns
- Extreme weather event detection
- Heat stress indices

### Satellite Data
- **10 weeks of NDVI data** (weekly captures)
- Vegetation indices (NDVI, EVI, SAVI, NDWI)
- Crop health status tracking
- Cloud cover information

### Alerts & Notifications
- **4 active alerts**:
  - Heatwave warning
  - Bollworm outbreak (CRITICAL)
  - Irrigation reminder
  - Cotton price drop alert

### Market & Pest Data
- **9 market price records** (Cotton, Soybean, Rice)
- **3 pest advisories** by crop type
- Price volatility tracking

### Financial Data
- **2 active loans** with repayment tracking
- Weather exposure calculations
- Risk-based monitoring

## 🎯 Exploring Features

### 1. Dashboard Overview

**Login as farmer1@demo.com**

You'll see:
- Summary cards (Total Fields, At-Risk Fields, Average Risk Score)
- Interactive map with color-coded risk markers
- List of all your fields with current risk levels

**What to Try:**
- Click on different fields on the map
- Switch between "Field Map View" and "Active Alerts" tabs
- Check the unread alert count

### 2. Field Details

**Click on "FIELD-001" (Cotton)**

You'll see:
- Overall risk score (likely HIGH due to cotton pest pressure)
- Risk component breakdown:
  - Weather Risk
  - Crop Health (NDVI)
  - Soil Moisture
  - Pest & Disease
  - Market Price
- Expected yield impact
- Repayment risk indicator

**What to Try:**
- Scroll to see AI-generated insights
- Check the recommendations from Gemini
- View historical trends

### 3. Risk Trend Charts

**Look for the charts section**

You'll see:
- **Risk Trend Chart**: 7-day forecast of all risk factors
- **NDVI Chart**: Crop health over past weeks
- **Weather Chart**: Temperature and rainfall forecast

**What to Try:**
- Hover over data points to see exact values
- Compare different risk factors
- Notice how NDVI trends correlate with crop stage

### 4. Alerts Center

**Click on "Active Alerts" tab**

You'll see:
- **CRITICAL**: Bollworm outbreak alert
- **WARNING**: Heatwave warning
- **WARNING**: Cotton price drop
- **INFO**: Irrigation reminder

**What to Try:**
- Click "Mark as read" on alerts
- Read the actionable recommendations
- Check different alert severity levels

### 5. AI Insights

**Scroll to AI-Powered Risk Analysis section**

You'll see:
- Natural language risk summary
- Specific recommendations
- Confidence level of predictions
- Urgency indicators

**What to Try:**
- Compare AI insights across different fields
- See how recommendations change by crop type
- Check confidence scores

### 6. Lender Dashboard

**Logout and login as lender@demo.com**

You'll see:
- Portfolio overview
- All borrowers' fields on map
- Aggregated risk exposure
- Repayment risk indicators

**What to Try:**
- View risk distribution across portfolio
- Check loan repayment risk scores
- Identify high-risk farmers

## 🧪 Testing Scenarios

### Scenario 1: High-Risk Field (Cotton)

1. Login as `farmer1@demo.com`
2. View FIELD-001 (Cotton)
3. Observe:
   - High overall risk (50-70)
   - Weather risk due to heat
   - Pest risk from bollworm
   - Active CRITICAL alert
4. Check AI recommendations
5. View 7-day risk forecast

### Scenario 2: Low-Risk Field (Rice)

1. Login as `farmer2@demo.com`
2. View FIELD-003 (Rice)
3. Observe:
   - Low overall risk (20-30)
   - Good NDVI readings
   - Adequate moisture
   - Minimal alerts
4. Compare with high-risk cotton field

### Scenario 3: Alert Response

1. Login as `farmer1@demo.com`
2. Go to "Active Alerts" tab
3. Read the "Bollworm Outbreak Alert"
4. Check actionable recommendations
5. Mark alert as read
6. Verify unread count decreases

### Scenario 4: Weather Extreme

1. Check the "Heatwave Warning" alert
2. View recommended actions
3. See how it affects risk scores
4. Check heat stress index in weather data

### Scenario 5: Market Intelligence

1. Read "Cotton Price Drop Alert"
2. Check market data
3. See recommendations for selling strategy
4. View price volatility indicators

## 📱 API Testing

### Using the API Directly

```bash
# 1. Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer1@demo.com","password":"demo123"}'

# Save the token from response

# 2. Get dashboard
curl http://localhost:5000/api/risks/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get field details
curl http://localhost:5000/api/fields/FIELD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Get alerts
curl http://localhost:5000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Get weather forecast
curl http://localhost:5000/api/fields/FIELD_ID/weather?days=15 \
  -H "Authorization: Bearer YOUR_TOKEN"

# 6. Get satellite data
curl http://localhost:5000/api/fields/FIELD_ID/satellite?days=60 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 Database Exploration

### Using Prisma Studio

```bash
cd backend
npx prisma studio
```

Opens a visual database browser at http://localhost:5555

**What to Explore:**
- View all users, fields, and crops
- See calculated risk scores
- Check weather and satellite data
- Examine alerts and their status
- View loan and repayment data

### Direct SQL Queries

```bash
psql -d agri_risk_demo -U postgres

-- View all fields with current crops
SELECT "fieldCode", "currentCrop", "cropStage", area FROM "Field";

-- View latest risk scores
SELECT f."fieldCode", r."overallRisk", r."riskLevel", r."forecastDate"
FROM "RiskScore" r
JOIN "Field" f ON r."fieldId" = f.id
ORDER BY r."forecastDate" DESC;

-- View active alerts
SELECT "alertType", "severity", "title" FROM "Alert"
WHERE "triggered" = true;

-- View market prices
SELECT commodity, market, "modalPrice", "priceChange"
FROM "MarketPrice";
```

## 🎨 UI Features to Explore

### Dashboard
- ✅ Summary statistics cards
- ✅ Color-coded risk indicators
- ✅ Tab navigation
- ✅ Responsive design

### Map View
- ✅ Interactive Leaflet map
- ✅ Color-coded field markers
- ✅ Click-to-view popups
- ✅ Risk-based coloring

### Charts
- ✅ Multi-line risk trends
- ✅ NDVI timeline
- ✅ Combined weather chart
- ✅ Hover interactions

### Alerts
- ✅ Severity-based styling
- ✅ Actionable recommendations
- ✅ Read/unread status
- ✅ Alert type categories

## 🔧 Customizing Demo Data

### Modify Risk Levels

Edit `backend/prisma/seed.ts`:

```typescript
// Increase risk for field 1
const field1Risk = 75 + day * 2; // Was 45 + day * 3

// Add more alerts
await prisma.alert.create({
  data: {
    alertType: 'IRRIGATION_NEEDED',
    severity: 'CRITICAL',
    title: 'Urgent Irrigation Required',
    // ...
  }
});
```

Then re-seed:
```bash
cd backend
npm run prisma:seed
```

### Add More Fields

```typescript
// In seed.ts
const field4 = await prisma.field.create({
  data: {
    farmerProfileId: farmer1.farmerProfile!.id,
    fieldCode: 'FIELD-004',
    currentCrop: 'Wheat',
    // ...
  }
});
```

## 📈 Performance Notes

- **Initial Load**: ~2-3 seconds
- **Risk Calculation**: ~500ms per field
- **Weather Data Fetch**: Cached (instant in demo mode)
- **Satellite Data**: Cached (instant in demo mode)
- **Map Rendering**: ~1 second for 3 fields
- **Charts Rendering**: ~500ms

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Restart PostgreSQL
sudo service postgresql restart
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Errors
```bash
cd backend
npx prisma generate
npx prisma db push --force-reset
npm run prisma:seed
```

### Missing Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## 📊 Data Statistics

- **Total Records**: ~140
- **Risk Calculations**: 21 (7 days × 3 fields)
- **Weather Records**: 45 (15 days × 3 fields)
- **Satellite Images**: 30 (10 weeks × 3 fields)
- **Active Alerts**: 4
- **Market Prices**: 9
- **Pest Advisories**: 3

## 🎓 Learning Paths

### For Developers
1. Explore the REST API endpoints
2. Check Prisma schema design
3. Review risk calculation algorithm
4. Study Gemini AI integration
5. Examine caching strategies

### For Product Managers
1. Test user flows (farmer & lender)
2. Evaluate alert effectiveness
3. Check actionability of recommendations
4. Assess UI/UX intuitiveness
5. Review data presentation

### For Domain Experts
1. Validate risk scoring weights
2. Review crop-specific advisories
3. Check pest identification accuracy
4. Evaluate market intelligence
5. Assess recommendation quality

## 🚀 Next Steps

After exploring the demo:

1. **Review Code**: Check implementation details
2. **Customize**: Modify risk algorithms for your region
3. **Integrate**: Connect real API keys
4. **Deploy**: Use Docker Compose for production
5. **Scale**: Add more fields and farmers

## 📞 Support

For issues or questions:
- Check `docs/API_DOCUMENTATION.md`
- Review `docs/ARCHITECTURE.md`
- See main `README.md`

---

**Enjoy exploring the Agricultural Risk Mitigation System! 🌾**
