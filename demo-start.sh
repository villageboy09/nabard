#!/bin/bash

echo "🌾 Starting Agricultural Risk Mitigation System - DEMO MODE"
echo "============================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL client not found. Please install PostgreSQL.${NC}"
    exit 1
fi

# Check if Redis is running (optional for demo)
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠ Redis not found. Continuing without Redis caching.${NC}"
fi

echo -e "\n${BLUE}Step 1: Setting up demo database...${NC}"

# Create demo database if it doesn't exist
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'agri_risk_demo'" | grep -q 1 || \
    psql -U postgres -c "CREATE DATABASE agri_risk_demo;"

echo -e "${GREEN}✓ Database ready${NC}"

echo -e "\n${BLUE}Step 2: Backend setup...${NC}"
cd backend

# Use demo environment
cp .env.demo .env

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push

# Seed database with demo data
echo "Seeding database with demo data..."
npm run prisma:seed

echo -e "${GREEN}✓ Backend ready${NC}"

# Start backend in background
echo -e "\n${BLUE}Step 3: Starting backend server...${NC}"
npm run dev &
BACKEND_PID=$!

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait for backend to start
sleep 5

# Frontend setup
echo -e "\n${BLUE}Step 4: Frontend setup...${NC}"
cd ../frontend

# Create demo environment
cat > .env << EOF
VITE_API_URL=http://localhost:5000/api
EOF

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}✓ Frontend ready${NC}"

# Start frontend
echo -e "\n${BLUE}Step 5: Starting frontend...${NC}"
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Display information
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Demo System Started Successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Access the application:${NC}"
echo "  📱 Frontend:  http://localhost:3000"
echo "  🔧 Backend:   http://localhost:5000"
echo "  💾 API Docs:  http://localhost:5000/api"
echo ""
echo -e "${BLUE}Demo Credentials:${NC}"
echo "  Farmer 1:  farmer1@demo.com / demo123"
echo "  Farmer 2:  farmer2@demo.com / demo123"
echo "  Lender:    lender@demo.com / demo123"
echo ""
echo -e "${BLUE}Features:${NC}"
echo "  ✓ 3 pre-populated fields with real crop data"
echo "  ✓ 7-day risk forecasts already calculated"
echo "  ✓ Active alerts and notifications"
echo "  ✓ Weather and satellite data (last 60 days)"
echo "  ✓ Gemini AI analysis and recommendations"
echo "  ✓ Interactive maps and charts"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap Ctrl+C and cleanup
trap cleanup INT

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✓ Services stopped${NC}"
    exit 0
}

# Wait for user interrupt
wait
