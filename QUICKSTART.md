# ⚡ Quick Start - 5 Minute Demo

Get the complete Agricultural Risk Mitigation System running with pre-populated data in 5 minutes!

## 🚀 One-Command Start

```bash
./demo-start.sh
```

That's it! The script handles everything automatically.

## 📋 What You'll Get

After running the script, you'll have:

✅ **Backend API** running on http://localhost:5000
✅ **Frontend Dashboard** on http://localhost:3000
✅ **3 demo farmers** with complete profiles
✅ **3 agricultural fields** with crops
✅ **7-day risk forecasts** for all fields
✅ **Active alerts** and notifications
✅ **Weather data** (15-day forecasts)
✅ **Satellite NDVI data** (60 days history)
✅ **AI-generated insights** from Gemini

## 🔑 Login Credentials

### Farmer Accounts
```
Email: farmer1@demo.com
Password: demo123
```

```
Email: farmer2@demo.com
Password: demo123
```

### Lender Account
```
Email: lender@demo.com
Password: demo123
```

## 🎯 What to Do Next

### 1. Open the Dashboard
Navigate to http://localhost:3000 in your browser

### 2. Login as Farmer
Use `farmer1@demo.com` / `demo123`

### 3. Explore Features
- **Dashboard**: See summary of all your fields
- **Map View**: Interactive map with risk indicators
- **Alerts**: Check active warnings (4 pre-loaded)
- **Risk Scores**: View detailed risk breakdowns
- **Charts**: NDVI trends, weather forecasts
- **AI Insights**: Gemini-generated recommendations

### 4. Test Scenarios

**High-Risk Field (Cotton)**
- Login as farmer1@demo.com
- Check FIELD-001
- See HIGH risk level (~65/100)
- Read CRITICAL bollworm alert
- View AI recommendations

**Low-Risk Field (Rice)**
- Login as farmer2@demo.com
- Check FIELD-003
- See LOW risk level (~25/100)
- Notice good NDVI values
- Check minimal alerts

## 🔍 Pre-loaded Data

The demo includes:

| Data Type | Count | Details |
|-----------|-------|---------|
| Users | 3 | 2 farmers + 1 lender |
| Fields | 3 | Cotton, Soybean, Rice |
| Risk Scores | 21 | 7 days × 3 fields |
| Weather Records | 45 | 15 days × 3 fields |
| Satellite Data | 30 | 10 weeks × 3 fields |
| Alerts | 4 | Various types & severities |
| Pest Advisories | 3 | By crop type |
| Market Prices | 9 | 3 crops × 3 markets |
| Loans | 2 | With repayment tracking |

## 📱 Testing the API

### Get Access Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"farmer1@demo.com","password":"demo123"}'
```

### Get Dashboard Data
```bash
curl http://localhost:5000/api/risks/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Alerts
```bash
curl http://localhost:5000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛠️ Manual Setup (Alternative)

If the script doesn't work:

```bash
# 1. Create database
createdb agri_risk_demo

# 2. Backend setup
cd backend
cp .env.demo .env
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

## ❓ Troubleshooting

**Port already in use:**
```bash
# Kill processes
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

**Database errors:**
```bash
cd backend
npx prisma db push --force-reset
npm run prisma:seed
```

**Missing dependencies:**
```bash
cd backend && npm install
cd frontend && npm install
```

## 📚 Learn More

- **Full Demo Guide**: See `DEMO_GUIDE.md`
- **API Documentation**: See `docs/API_DOCUMENTATION.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Deployment**: See `docs/DEPLOYMENT.md`

## 🎓 Key Features to Test

### ✅ Risk Prediction
- View 7-15 day risk forecasts
- Check multi-factor risk breakdown
- See yield impact predictions

### ✅ AI Analysis
- Read Gemini-generated summaries
- Follow AI recommendations
- Check confidence scores

### ✅ Alerts System
- Review active alerts
- Read actionable advice
- Test mark-as-read functionality

### ✅ Data Visualization
- Explore interactive maps
- View trend charts
- Analyze NDVI timelines

### ✅ Multi-Role Support
- Login as farmer
- Login as lender
- Compare dashboards

## 🎯 Demo Use Cases

### Use Case 1: Farmer Risk Check
1. Login as farmer
2. View dashboard
3. Check field with HIGH risk
4. Read AI recommendations
5. Review active alerts

### Use Case 2: Lender Portfolio Review
1. Login as lender
2. View all borrowers
3. Check repayment risk
4. Identify high-exposure fields

### Use Case 3: Alert Response
1. Go to Alerts tab
2. Read CRITICAL bollworm alert
3. Review control measures
4. Mark as read

## 💡 Pro Tips

- **Switch between users** to see different perspectives
- **Check API responses** to understand data structure
- **Use Prisma Studio** (`npx prisma studio`) to explore database
- **Modify seed data** in `backend/prisma/seed.ts` for custom scenarios
- **Check logs** for detailed system behavior

## 🚦 System Status

Once running, verify:
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:5000
- [ ] Login works with demo credentials
- [ ] Dashboard shows 3 fields
- [ ] Map displays field markers
- [ ] Alerts tab shows 4 alerts
- [ ] Charts render correctly

## 🎉 Success!

If you can:
1. ✅ Login with demo credentials
2. ✅ See fields on the map
3. ✅ View risk scores
4. ✅ Read alerts
5. ✅ See AI recommendations

**Congratulations! The system is working perfectly!** 🌾

---

**Questions?** Check the full `DEMO_GUIDE.md` or main `README.md`
