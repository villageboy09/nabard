# 🚀 Vercel Deployment Guide

Complete guide to deploy the Agricultural Risk Mitigation System on Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Use one of:
   - Vercel Postgres (recommended)
   - Supabase
   - Neon
   - Railway
   - Any PostgreSQL provider

## 🗄️ Step 1: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Storage** → **Create Database**
3. Select **Postgres**
4. Name it `agri-risk-db`
5. Select your region
6. Click **Create**

Vercel will automatically provide:
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

### Option B: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Format as:
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```

### Option C: Neon

1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Use for both `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`

## 🚀 Step 2: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New** → **Project**
   - Select your GitHub repository
   - Click **Import**

2. **Configure Build Settings**
   ```
   Framework Preset: Vite
   Build Command: npm run vercel-build
   Output Directory: frontend/dist
   Install Command: npm install
   ```

3. **Add Environment Variables**

   Click **Environment Variables** and add:

   ```bash
   # Database (automatically added if using Vercel Postgres)
   POSTGRES_PRISMA_URL=your-postgres-url
   POSTGRES_URL_NON_POOLING=your-postgres-direct-url

   # JWT Secret (generate strong secret)
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d

   # Demo Mode
   DEMO_MODE=true

   # Node Environment
   NODE_ENV=production
   ```

4. **Deploy**
   - Click **Deploy**
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live!

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add POSTGRES_PRISMA_URL
vercel env add POSTGRES_URL_NON_POOLING
vercel env add JWT_SECRET
vercel env add DEMO_MODE

# Deploy to production
vercel --prod
```

## 🗃️ Step 3: Initialize Database

After deployment, initialize your database:

### Option A: Use Vercel CLI

```bash
# Connect to your project
vercel link

# Run migrations
vercel env pull .env.local
cd backend
npx prisma generate
npx prisma db push

# Seed demo data
npx prisma db seed
```

### Option B: Use Prisma Data Platform

1. Go to your database provider's console
2. Run SQL from `backend/prisma/migrations/`
3. Or use Prisma Studio:
   ```bash
   DATABASE_URL="your-url" npx prisma studio
   ```

### Option C: Run Seed Script Manually

```bash
# Set your database URL
export POSTGRES_PRISMA_URL="your-url"

# Generate Prisma client
cd backend
npx prisma generate

# Push schema
npx prisma db push

# Seed data
npm run prisma:seed
```

## ✅ Step 4: Verify Deployment

1. **Check Homepage**
   - Visit `your-app.vercel.app`
   - Should see React dashboard

2. **Test API**
   ```bash
   # Health check
   curl https://your-app.vercel.app/api/health

   # Login
   curl -X POST https://your-app.vercel.app/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"farmer1@demo.com","password":"demo123"}'
   ```

3. **Test Frontend**
   - Go to your Vercel URL
   - Login with demo credentials
   - Check dashboard loads
   - Verify map displays
   - Test alerts

## 🔧 Configuration Files

Your project should have these Vercel-specific files:

### Root: `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/frontend/$1" }
  ]
}
```

### Root: `package.json`
```json
{
  "scripts": {
    "vercel-build": "cd frontend && npm install && npm run build"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### API Functions

Located in `/api` directory:
- `login.js` - Authentication
- `dashboard.js` - Dashboard data
- `alerts.js` - Alerts endpoint
- `fields.js` - Fields endpoint

Each is a serverless function that auto-scales.

## 📱 Step 5: Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `agri-risk.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate (~10 minutes)

## 🔒 Security Best Practices

### 1. Environment Variables

Never commit `.env` files. Use Vercel's environment variable management.

```bash
# Generate strong JWT secret
openssl rand -hex 32

# Add to Vercel
vercel env add JWT_SECRET production
```

### 2. Database Security

- Use connection pooling (`POSTGRES_PRISMA_URL`)
- Enable SSL connections
- Whitelist Vercel IPs (if using external database)
- Regular backups

### 3. CORS Configuration

Already configured in API functions:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
```

For production, restrict to your domain:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
```

## 📊 Monitoring & Logs

### View Logs

1. Go to **Deployments** in Vercel Dashboard
2. Click on latest deployment
3. Click **Logs** tab
4. Filter by function or error level

### Analytics

Vercel provides free analytics:
- Page views
- Load times
- API response times
- Error rates

Enable in **Project Settings** → **Analytics**

## 🔄 Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview deployments
- Pull requests → Preview deployments

Configure in **Git** settings.

## 🐛 Troubleshooting

### Issue: "Internal Server Error" on API

**Solution**: Check Vercel logs
```bash
vercel logs your-app.vercel.app
```

Common causes:
- Missing environment variables
- Database connection issues
- Cold start timeouts

### Issue: Database Connection Timeout

**Solution**: Use connection pooling

```javascript
// In API functions
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL
    }
  }
});
```

### Issue: Prisma Client Not Generated

**Solution**: Add postinstall script

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Issue: 404 on API Routes

**Solution**: Check `vercel.json` routes configuration

### Issue: Frontend Blank Page

**Solution**:
1. Check build logs for errors
2. Verify `VITE_API_URL` is set correctly
3. Check browser console for errors

### Issue: CORS Errors

**Solution**: API functions already include CORS headers. If still seeing errors:
```javascript
// Add to each API function
if (req.method === 'OPTIONS') {
  res.status(200).end();
  return;
}
```

## 🔧 Advanced Configuration

### Custom Build Steps

Add to `vercel.json`:
```json
{
  "buildCommand": "npm run vercel-build && npx prisma generate"
}
```

### Serverless Function Config

Add to API functions:
```javascript
export const config = {
  maxDuration: 10, // Max execution time (seconds)
  memory: 1024,    // Memory allocation (MB)
};
```

### Edge Functions

For ultra-low latency, convert to Edge Functions:
```javascript
export const config = {
  runtime: 'edge',
};
```

## 📈 Scaling

Vercel automatically scales:
- **Frontend**: CDN-distributed globally
- **API Functions**: Auto-scale based on traffic
- **Cold Starts**: < 100ms after warmup

For high traffic:
1. Use **Vercel Postgres** (auto-scaling)
2. Enable **Edge Network** caching
3. Optimize database queries
4. Use **Vercel KV** for session storage

## 💰 Pricing

**Hobby Plan** (Free):
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ SSL certificates
- ✅ Preview deployments

**Pro Plan** ($20/month):
- ✅ Unlimited bandwidth
- ✅ Advanced analytics
- ✅ Team collaboration
- ✅ Password protection
- ✅ Priority support

## 🎯 Production Checklist

Before going live:

- [ ] Database migrations completed
- [ ] Demo data seeded
- [ ] Environment variables set
- [ ] JWT secret is strong
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] CORS properly configured
- [ ] Error monitoring enabled
- [ ] Analytics enabled
- [ ] Backup strategy in place
- [ ] Tested all API endpoints
- [ ] Tested all user flows
- [ ] Load testing completed

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Next Steps API Routes](https://vercel.com/docs/functions/serverless-functions)

## 🆘 Getting Help

1. **Vercel Support**: [vercel.com/support](https://vercel.com/support)
2. **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
3. **Prisma Discord**: [pris.ly/discord](https://pris.ly/discord)

## 🎉 Success!

Once deployed, your app is:
- ✅ Live on `https://your-app.vercel.app`
- ✅ Auto-scaling globally
- ✅ SSL-secured
- ✅ CDN-distributed
- ✅ Zero-downtime deployments
- ✅ Preview deployments for PRs

**Your Agricultural Risk Mitigation System is now production-ready on Vercel!** 🌾

---

## Demo Credentials

After deployment, test with:
- **Farmer**: `farmer1@demo.com` / `demo123`
- **Lender**: `lender@demo.com` / `demo123`
