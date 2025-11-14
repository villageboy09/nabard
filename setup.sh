#!/bin/bash

echo "🌾 Agricultural Risk Mitigation System - Setup Script"
echo "======================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
        return 0
    fi
}

echo -e "\n${YELLOW}Checking prerequisites...${NC}"
check_command node || exit 1
check_command npm || exit 1
check_command psql || echo -e "${YELLOW}⚠ PostgreSQL not found. Please install it manually.${NC}"
check_command redis-cli || echo -e "${YELLOW}⚠ Redis not found. Please install it manually.${NC}"

# Backend setup
echo -e "\n${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please update .env with your API keys${NC}"
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo -e "${GREEN}✓ Backend setup complete${NC}"

# Frontend setup
echo -e "\n${YELLOW}Setting up frontend...${NC}"
cd ../frontend

if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
fi

echo "Installing frontend dependencies..."
npm install

echo -e "${GREEN}✓ Frontend setup complete${NC}"

# Database setup instructions
echo -e "\n${YELLOW}Database Setup Instructions:${NC}"
echo "1. Create PostgreSQL database:"
echo "   createdb agri_risk_db"
echo ""
echo "2. Run migrations:"
echo "   cd backend && npx prisma migrate dev"
echo ""
echo "3. (Optional) Seed database:"
echo "   cd backend && npm run seed"

# Final instructions
echo -e "\n${GREEN}Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your API keys"
echo "2. Create and migrate database (see instructions above)"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm run dev"
echo ""
echo "Dashboard will be available at: http://localhost:3000"
echo "API will be available at: http://localhost:5000"
