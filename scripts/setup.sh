#!/bin/bash

# Invoice Financing dApp Setup Script
# This script sets up all dependencies and initializes the project

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Invoice Financing dApp Setup                              ║"
echo "║     Setting up all services and dependencies...               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check for required tools
echo "Checking for required tools..."
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting." >&2; exit 1; }

echo "✓ All required tools found"
echo ""

# Setup Backend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting up Backend Server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd backend

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file for backend..."
  cat > .env << EOF
NODE_ENV=development
PORT=3001

# Algorand Network Configuration
ALGOD_TOKEN=a
ALGOD_SERVER=http://localhost
ALGOD_PORT=4001
INDEXER_SERVER=http://localhost
INDEXER_PORT=8980
EOF
  echo "✓ Backend .env created (update with your settings)"
fi

# Install dependencies
echo "Installing backend dependencies..."
npm install
echo "✓ Backend dependencies installed"

cd ..
echo ""

# Setup Frontend
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting up Frontend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd frontend

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file for frontend..."
  cat > .env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ALGOD_SERVER=http://localhost
REACT_APP_ALGOD_PORT=4001
REACT_APP_ALGOD_TOKEN=a
REACT_APP_NETWORK=testnet
EOF
  echo "✓ Frontend .env created"
fi

# Install dependencies
echo "Installing frontend dependencies..."
npm install
echo "✓ Frontend dependencies installed"

cd ..
echo ""

# Setup AI Service
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting up AI Risk Scoring Service..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd ai-service

# Create virtual environment
if [ ! -d venv ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv venv
  echo "✓ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing AI service dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo "✓ AI service dependencies installed"

cd ..
echo ""

# Setup Smart Contracts
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setting up Smart Contracts..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd smart-contracts

# Create virtual environment if needed
if [ ! -d venv ]; then
  echo "Creating Python virtual environment for smart contracts..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "Installing smart contract dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
echo "✓ Smart contract dependencies installed"

cd ..
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║             Setup Complete!                                   ║"
echo "║                                                                ║"
echo "║  Next Steps:                                                   ║"
echo "║  1. Make sure Algorand node is running locally                 ║"
echo "║  2. Update .env files with your configuration                  ║"
echo "║  3. Run: bash scripts/run-demo.sh                              ║"
echo "║                                                                ║"
echo "║  Services to start:                                            ║"
echo "║  - Backend: npm start (from backend/)                          ║"
echo "║  - Frontend: npm start (from frontend/)                        ║"
echo "║  - AI Service: python main.py (from ai-service/)               ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
cd ../frontend
npm install

echo "Setup complete! Run individual services as needed."