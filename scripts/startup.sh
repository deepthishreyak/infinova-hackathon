#!/bin/bash

# Invoice Financing Platform - Production Startup Script
# This script starts all services in production mode

set -e

echo "=================================================="
echo "Invoice Financing Platform - Starting Services"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi
log_success "Node.js $(node --version) found"

if ! command -v python3 &> /dev/null; then
    log_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
    exit 1
fi
log_success "Python $(python3 --version) found"

# Create .env files if they don't exist
log_info "Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env 2>/dev/null || cat > backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
ALGORAND_NETWORK=testnet
ALGOD_SERVER=http://localhost:4001
ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
AI_SERVICE_URL=http://localhost:8000
EOF
    log_success "Created backend/.env"
else
    log_info "backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << 'EOF'
REACT_APP_BACKEND_URL=http://localhost:3001
REACT_APP_NETWORK=testnet
EOF
    log_success "Created frontend/.env"
else
    log_info "frontend/.env already exists"
fi

if [ ! -f "ai-service/.env" ]; then
    cat > ai-service/.env << 'EOF'
ENVIRONMENT=production
LOG_LEVEL=info
EOF
    log_success "Created ai-service/.env"
else
    log_info "ai-service/.env already exists"
fi

# Install dependencies
log_info "Installing dependencies..."

if [ ! -d "backend/node_modules" ]; then
    log_info "Installing backend dependencies..."
    cd backend && npm ci && cd .. || { log_error "Failed to install backend"; exit 1; }
    log_success "Backend dependencies installed"
else
    log_info "Backend dependencies already installed"
fi

if [ ! -d "frontend/node_modules" ]; then
    log_info "Installing frontend dependencies..."
    cd frontend && npm ci && cd .. || { log_error "Failed to install frontend"; exit 1; }
    log_success "Frontend dependencies installed"
else
    log_info "Frontend dependencies already installed"
fi

if [ ! -d "ai-service/venv" ]; then
    log_info "Creating Python virtual environment..."
    python3 -m venv ai-service/venv || { log_error "Failed to create venv"; exit 1; }
    log_success "Virtual environment created"
fi

if [ ! -f "ai-service/venv/bin/uvicorn" ]; then
    log_info "Installing AI service dependencies..."
    source ai-service/venv/bin/activate
    pip install -r ai-service/requirements.txt || { log_error "Failed to install AI dependencies"; exit 1; }
    deactivate
    log_success "AI service dependencies installed"
else
    log_info "AI service dependencies already installed"
fi

# Create startup instructions
cat > /tmp/startup_instructions.txt << 'EOF'

================================================
Ready to Start Services!
================================================

Open 3 new terminal windows and run these commands:

TERMINAL 1 - Backend API (Port 3001):
cd backend && npm start

TERMINAL 2 - AI Service (Port 8000):
cd ai-service && source venv/bin/activate && python -m uvicorn main:app --reload
(Windows: venv\Scripts\activate instead)

TERMINAL 3 - Frontend UI (Port 3000):
cd frontend && npm start

Then open your browser:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:3001/api/health
- AI Docs: http://localhost:8000/docs

================================================

OR use Docker Compose (if Docker installed):
docker-compose up

================================================
EOF

log_success "All dependencies installed!"
echo ""
cat /tmp/startup_instructions.txt
echo ""
log_info "To verify everything is working:"
echo "  1. Start services in 3 terminals (see above)"
echo "  2. Connect wallet at http://localhost:3000"
echo "  3. Create an invoice"
echo "  4. Check QUICKSTART.md for complete walkthrough"

exit 0
