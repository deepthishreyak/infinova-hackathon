#!/bin/bash

# Invoice Financing dApp Demo Script
# This script starts all services for a complete demo

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Invoice Financing dApp - Full Stack Demo                  ║"
echo "║     Starting all services...                                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Start AI Service
print_section "Starting AI Risk Scoring Service (Port 8000)..."
cd ai-service
if [ -d venv ]; then
    source venv/bin/activate
fi
python main.py > /tmp/ai-service.log 2>&1 &
AI_PID=$!
sleep 2
echo "✓ AI Service started (PID: $AI_PID)"
cd ..

# Start Backend
print_section "Starting Backend API Server (Port 3001)..."
cd backend
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3
echo "✓ Backend started (PID: $BACKEND_PID)"
cd ..

# Start Frontend
print_section "Starting React Frontend (Port 3000)..."
cd frontend
BROWSER=none npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 5
echo "✓ Frontend started (PID: $FRONTEND_PID)"
cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║             All Services Started!                             ║"
echo "║                                                                ║"
echo "║  ✓ AI Service: http://localhost:8000                          ║"
echo "║    API Docs: http://localhost:8000/docs                       ║"
echo "║                                                                ║"
echo "║  ✓ Backend API: http://localhost:3001                         ║"
echo "║    Health: http://localhost:3001/api/health                   ║"
echo "║                                                                ║"
echo "║  ✓ Frontend: http://localhost:3000                            ║"
echo "║                                                                ║"
echo "║  Process IDs:                                                  ║"
echo "║  - AI Service: $AI_PID"
echo "║  - Backend: $BACKEND_PID"
echo "║  - Frontend: $FRONTEND_PID"
echo "║                                                                ║"
echo "║  To stop all services, run:                                    ║"
echo "║  kill $AI_PID $BACKEND_PID $FRONTEND_PID                      ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Wait for all services
wait