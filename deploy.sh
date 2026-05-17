#!/bin/bash
# ╔════════════════════════════════════════════════╗
# ║   POS Abadi Jaya — VPS Auto Deploy Script     ║
# ║   Run: chmod +x deploy.sh && ./deploy.sh      ║
# ╚════════════════════════════════════════════════╝

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║   POS Abadi Jaya — VPS Deployment              ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# ──── Color codes ────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ──── STEP 1: Check prerequisites ────
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed!${NC}"
    echo "Install: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker & Docker Compose OK${NC}"

# ──── STEP 2: Setup .env ────
echo -e "${YELLOW}[2/6] Checking environment config...${NC}"

if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        echo -e "${YELLOW}⚠️  .env created from template. EDIT IT NOW!${NC}"
        echo ""
        echo "  nano .env"
        echo ""
        echo "  Change these values:"
        echo "    DB_PASS=your_secure_password"
        echo "    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo 'generate_a_random_string')"
        echo ""
        read -p "Press Enter after editing .env, or Ctrl+C to cancel..."
    else
        echo -e "${RED}❌ No .env or .env.production found!${NC}"
        exit 1
    fi
fi

# Validate critical env vars
source .env
if [ "$JWT_SECRET" = "GANTI_JWT_SECRET_INI_SEKARANG" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}❌ JWT_SECRET belum diganti di .env!${NC}"
    exit 1
fi

if [ "$DB_PASS" = "GANTI_PASSWORD_INI_SEKARANG" ] || [ -z "$DB_PASS" ]; then
    echo -e "${RED}❌ DB_PASS belum diganti di .env!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment config OK${NC}"

# ──── STEP 3: Create required directories ────
echo -e "${YELLOW}[3/6] Creating directories...${NC}"

mkdir -p deploy/ssl
mkdir -p server/public/uploads

echo -e "${GREEN}✅ Directories OK${NC}"

# ──── STEP 4: Build images ────
echo -e "${YELLOW}[4/6] Building Docker images...${NC}"

docker compose build --no-cache

echo -e "${GREEN}✅ Images built${NC}"

# ──── STEP 5: Start services ────
echo -e "${YELLOW}[5/6] Starting services...${NC}"

docker compose up -d

echo -e "${GREEN}✅ Services started${NC}"

# ──── STEP 6: Verify ────
echo -e "${YELLOW}[6/6] Verifying deployment...${NC}"

# Wait for services to be ready
echo "  Waiting for services to start (30s)..."
sleep 30

# Check if containers are running
if docker compose ps | grep -q "running"; then
    echo -e "${GREEN}✅ All containers are running!${NC}"
else
    echo -e "${RED}⚠️  Some containers may not be running:${NC}"
    docker compose ps
fi

# Check backend health
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Backend API responding (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend returned HTTP $HEALTH (may still be starting)${NC}"
fi

# Check frontend
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
if [ "$FRONTEND" = "200" ]; then
    echo -e "${GREEN}✅ Frontend responding (HTTP 200)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend returned HTTP $FRONTEND${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   ✅ DEPLOYMENT COMPLETE!                      ║"
echo "║                                                ║"
echo "║   Frontend: http://YOUR_VPS_IP                 ║"
echo "║   Backend:  http://YOUR_VPS_IP/api             ║"
echo "║                                                ║"
echo "║   Login:    admin / admin123                   ║"
echo "║                                                ║"
echo "║   Logs:     docker compose logs -f             ║"
echo "║   Stop:     docker compose down                ║"
echo "║   Restart:  docker compose restart             ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Setup SSL: certbot certonly --standalone -d your-domain.com"
echo "  2. Copy certs to deploy/ssl/"
echo "  3. Uncomment HTTPS in client/nginx.conf"
echo "  4. docker compose restart frontend"
