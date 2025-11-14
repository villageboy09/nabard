# Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Nginx (for production)
- SSL Certificate (for HTTPS)

## Environment Setup

### 1. Database Setup

**PostgreSQL**:
```bash
# Create database
createdb agri_risk_db

# Create user
psql -c "CREATE USER agri_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE agri_risk_db TO agri_user;"
```

**Redis**:
```bash
# Install and start Redis
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### 2. Backend Deployment

```bash
cd backend

# Install dependencies
npm ci --production

# Set environment variables
cat > .env << EOF
DATABASE_URL=postgresql://agri_user:password@localhost:5432/agri_risk_db
PORT=5000
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
REDIS_URL=redis://localhost:6379

# API Keys
WEATHER_API_KEY=your_key
GEMINI_API_KEY=your_key
SATELLITE_API_KEY=your_key
AGRI_STACK_API_KEY=your_key
MARKET_API_KEY=your_key

# Cron schedule (daily at 6 AM)
RISK_CRON_SCHEDULE="0 6 * * *"
EOF

# Run database migrations
npx prisma generate
npx prisma migrate deploy

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name agri-risk-api
pm2 save
pm2 startup
```

### 3. Frontend Deployment

```bash
cd frontend

# Install dependencies
npm ci

# Set environment variables
cat > .env << EOF
VITE_API_URL=https://your-api-domain.com/api
EOF

# Build
npm run build

# The dist/ folder contains the production build
```

### 4. Nginx Configuration

**API Reverse Proxy** (`/etc/nginx/sites-available/agri-risk-api`):
```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Frontend** (`/etc/nginx/sites-available/agri-risk-frontend`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/agri-risk-frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable sites:
```bash
sudo ln -s /etc/nginx/sites-available/agri-risk-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/agri-risk-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificates (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

### 6. Cron Job Setup

The alerts engine runs automatically via node-cron inside the application. To run manually:

```bash
cd backend
pm2 start "npm run cron:alerts" --cron "0 6 * * *" --name agri-risk-cron
```

### 7. Monitoring & Logs

**PM2 Logs**:
```bash
pm2 logs agri-risk-api
pm2 logs agri-risk-api --lines 100
```

**Application Logs**:
```bash
tail -f backend/logs/all.log
tail -f backend/logs/error.log
```

**PM2 Monitoring**:
```bash
pm2 monit
```

**PM2 Web Dashboard** (optional):
```bash
pm2 install pm2-server-monit
```

## Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: agri_risk_db
      POSTGRES_USER: agri_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://agri_user:${DB_PASSWORD}@postgres:5432/agri_risk_db
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
      PORT: 5000
      JWT_SECRET: ${JWT_SECRET}
      WEATHER_API_KEY: ${WEATHER_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    ports:
      - "5000:5000"
    volumes:
      - ./backend/logs:/app/logs

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:80"
    environment:
      VITE_API_URL: https://api.your-domain.com/api

volumes:
  postgres_data:
  redis_data:
```

Backend Dockerfile (`backend/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Frontend Dockerfile (`frontend/Dockerfile`):
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Deploy:
```bash
# Create .env file
cat > .env << EOF
DB_PASSWORD=your_secure_password
JWT_SECRET=$(openssl rand -hex 32)
WEATHER_API_KEY=your_key
GEMINI_API_KEY=your_key
EOF

# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

## Kubernetes Deployment

### Kubernetes Manifests

See `k8s/` directory for:
- `deployment.yaml` - Application deployments
- `service.yaml` - Service definitions
- `ingress.yaml` - Ingress configuration
- `configmap.yaml` - Configuration
- `secrets.yaml` - Secrets

Deploy:
```bash
kubectl apply -f k8s/
```

## Performance Optimization

### Backend

1. **Enable clustering**:
```javascript
// backend/src/cluster.ts
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  require('./index.js');
}
```

2. **Database connection pooling** (already configured in Prisma)

3. **Redis caching** (already implemented)

### Frontend

1. **Code splitting** (Vite does this automatically)

2. **Asset optimization**:
```bash
npm install -D vite-plugin-compression
```

3. **CDN for static assets**

## Security Checklist

- ✅ HTTPS enabled
- ✅ Environment variables secured
- ✅ Database credentials rotated
- ✅ JWT secret is strong
- ✅ Rate limiting enabled
- ✅ CORS configured properly
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention
- ✅ Helmet.js for security headers

## Backup Strategy

### Database Backup
```bash
# Daily backup cron
0 2 * * * pg_dump -U agri_user agri_risk_db | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### Application Backup
```bash
# Backup logs and data
tar -czf backup_$(date +%Y%m%d).tar.gz backend/logs backend/.env
```

## Scaling

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple backend instances
- Shared Redis for sessions
- PostgreSQL read replicas

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Add database indices

## Monitoring

### Health Checks
```bash
# API health
curl https://api.your-domain.com/health

# Database
pm2 install pm2-server-monit
```

### Log Aggregation
- ELK Stack (Elasticsearch, Logstash, Kibana)
- CloudWatch (AWS)
- Datadog

### Metrics
- PM2 metrics
- Database metrics
- Redis metrics
- Custom application metrics

## Troubleshooting

### Common Issues

**Backend not starting**:
```bash
pm2 logs agri-risk-api --err
# Check DATABASE_URL, API keys
```

**Database connection error**:
```bash
# Test connection
psql $DATABASE_URL
```

**High memory usage**:
```bash
pm2 restart agri-risk-api
# Check for memory leaks
```

**Cron jobs not running**:
```bash
# Check logs
pm2 logs agri-risk-api | grep "cron"
```

## Rollback

```bash
# Backend
pm2 stop agri-risk-api
cd backend
git checkout <previous-commit>
npm install
npm run build
pm2 restart agri-risk-api

# Frontend
cd frontend
git checkout <previous-commit>
npm install
npm run build
sudo cp -r dist/* /var/www/agri-risk-frontend/dist/
```
