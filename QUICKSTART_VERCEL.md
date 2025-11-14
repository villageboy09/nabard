# ⚡ Quick Deploy to Vercel (5 Minutes)

Deploy the complete Agricultural Risk Mitigation System to Vercel in just 5 minutes!

## 🚀 Quick Deploy Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/nabard)

## 📋 Manual Deployment Steps

### 1. Push to GitHub (if not already done)

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Website (Easiest)**

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Click **Deploy**

**Option B: Via CLI**

```bash
npm i -g vercel
vercel login
vercel
```

### 3. Add Database

**Using Vercel Postgres:**

1. In Vercel Dashboard, go to **Storage**
2. Click **Create Database** → **Postgres**
3. Name it `agri-risk-db`
4. Connection strings are added automatically!

**Or use external database:**
- [Supabase](https://supabase.com) (Free tier available)
- [Neon](https://neon.tech) (Free tier available)
- [Railway](https://railway.app) (Free tier available)

### 4. Set Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**:

```bash
POSTGRES_PRISMA_URL=your-database-url
POSTGRES_URL_NON_POOLING=your-database-url
JWT_SECRET=your-secret-key-here
DEMO_MODE=true
```

Generate JWT secret:
```bash
openssl rand -hex 32
```

### 5. Initialize Database

```bash
# Pull environment variables
vercel env pull .env.local

# Navigate to backend
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed demo data
npm run prisma:seed
```

### 6. Done! 🎉

Your app is live at: `https://your-app.vercel.app`

## 🔑 Test Your Deployment

### Login
```
Email: farmer1@demo.com
Password: demo123
```

### API Test
```bash
curl https://your-app.vercel.app/api/health
```

## 🐛 Quick Troubleshooting

**API not working?**
- Check environment variables are set
- Check Vercel logs: `vercel logs`

**Database connection error?**
- Verify `POSTGRES_PRISMA_URL` is correct
- Run `npx prisma db push` again

**Frontend blank page?**
- Check browser console for errors
- Verify build completed successfully

## 🎯 What You Get

✅ **Global CDN** - Fast worldwide
✅ **Auto-scaling** - Handles any traffic
✅ **SSL/HTTPS** - Automatic security
✅ **Serverless API** - No server management
✅ **Preview Deployments** - Test before production
✅ **Zero Downtime** - Seamless updates

## 📊 Free Tier Limits

Vercel Hobby (Free):
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless functions (100GB-Hrs)
- ✅ Unlimited domains

Perfect for demos and hackathons!

## 🔗 Useful Links

- **Dashboard**: https://vercel.com/dashboard
- **Logs**: https://vercel.com/your-project/logs
- **Docs**: https://vercel.com/docs

## ⚙️ Advanced (Optional)

### Custom Domain
1. Go to **Settings** → **Domains**
2. Add your domain
3. Update DNS records
4. SSL auto-configured!

### Environment Variables per Branch
```bash
# Production
vercel env add JWT_SECRET production

# Preview
vercel env add JWT_SECRET preview

# Development
vercel env add JWT_SECRET development
```

### Database Backups
```bash
# Export data
pg_dump $POSTGRES_URL > backup.sql

# Import data
psql $POSTGRES_URL < backup.sql
```

## 🎉 Next Steps

1. ✅ Test all features
2. ✅ Add custom domain (optional)
3. ✅ Enable analytics
4. ✅ Share your demo!

---

**Need help?** Check the full [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) guide or [Vercel docs](https://vercel.com/docs).

**Your agri-tech solution is now globally deployed!** 🌾
