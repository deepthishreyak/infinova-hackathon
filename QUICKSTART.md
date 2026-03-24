# Quick Start Guide

Get the Invoice Financing platform running in 5 minutes.

## Prerequisites

- **Node.js** 16+ (check: `node --version`)
- **npm** 8+ (check: `npm --version`)
- **Python** 3.8+ (check: `python --version`)
- **Docker** (optional, check: `docker --version`)
- **Git** (check: `git --version`)

## Option 1: Automated Setup (Recommended)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/invoice-financing.git
cd invoice-financing
```

### 2. Run Setup Script

```bash
bash scripts/setup.sh
```

This automatically:
- ✅ Installs Node dependencies
- ✅ Installs Python packages
- ✅ Creates virtual environment
- ✅ Generates .env files
- ✅ Verifies installations

### 3. Start All Services

```bash
bash scripts/run-demo.sh
```

Or manually in separate terminals:

```bash
# Terminal 1: Backend (port 3001)
cd backend && npm start

# Terminal 2: AI Service (port 8000)
cd ai-service && source venv/bin/activate && python -m uvicorn main:app --reload

# Terminal 3: Frontend (port 3000)
cd frontend && npm start
```

### 4. Access the Platform

Open browser tabs:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main UI |
| **Backend** | http://localhost:3001/api/health | API health check |
| **AI Service** | http://localhost:8000/docs | API documentation |

---

## Option 2: Docker Compose Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/invoice-financing.git
cd invoice-financing
```

### 2. Start with Docker

```bash
docker-compose up -d
```

Check logs:
```bash
docker-compose logs -f
```

View running containers:
```bash
docker-compose ps
```

Access services:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- AI Service: http://localhost:8000

---

## Your First Invoice (5 Minutes)

### Step 1: Connect Wallet

1. Open http://localhost:3000
2. Click **"Connect Wallet"**
3. Install Pera Wallet if needed
4. Select account and approve connection

### Step 2: Create Invoice (Supplier)

1. Click **"Supplier Panel"** tab
2. Fill in form:
   - **Buyer Address**: `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HWA` (test address)
   - **Amount**: `10` ALGO
   - **Due Date**: Pick date 30 days from now
   - **Description**: `Test invoice`
3. Click **"Create Invoice"**
4. ✅ Invoice created! Get the ID from response

### Step 3: Finance Invoice (Investor)

1. Switch to different Algorand account (or use main)
2. Click **"Investor Panel"** tab
3. Click on your invoice
4. Click **"Calculate Risk Score"**
   - Shows: Risk level, interest rate, confidence
5. Click **"Finance Invoice"**
6. Enter amount and click **"Confirm Financing"**
7. ✅ Invoice financed! Smart contract executed

### Step 4: View Analytics

1. Click **"Analytics"** tab
2. See live metrics:
   - Total invoices
   - Total volume financed
   - Liquidity pool balance
   - Average interest rate

---

## Common First-Time Issues

### "Backend not responding"

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# If not running:
cd backend && npm install && npm start
```

### "Wallet won't connect"

```bash
# 1. Install Pera Wallet extension
# 2. Refresh page
# 3. Check browser console (F12) for errors
# 4. Try different browser if needed
```

### "Port already in use"

```bash
# Find and kill process on port
# Port 3000 (frontend):
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Port 3001 (backend):
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Port 8000 (AI):
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### "Module not found" errors

```bash
# Clear caches and reinstall
cd backend && rm -rf node_modules package-lock.json && npm install
cd ../frontend && rm -rf node_modules package-lock.json && npm install
cd ../ai-service && pip install -r requirements.txt --force-reinstall
```

---

## File Structure Overview

```
invoice-financing/
├── README.md                 # Main documentation
├── package.json              # Project metadata
├── docker-compose.yml        # Multi-service orchestration
│
├── backend/                  # Node.js API server
│   ├── server.js            # Main Express app
│   ├── package.json         # Dependencies
│   └── .env                 # Configuration
│
├── frontend/                 # React web interface
│   ├── public/index.html    # Entry point
│   ├── src/
│   │   ├── App.js          # Root component
│   │   ├── index.css       # Styling
│   │   └── components/     # React components
│   └── .env                # Configuration
│
├── ai-service/               # Python risk scoring
│   ├── main.py             # FastAPI application
│   ├── requirements.txt     # Dependencies
│   └── .env                # Configuration
│
├── smart-contracts/          # Algorand smart contracts
│   ├── invoice_contract.py # PyTeal contract
│   ├── compile.py          # Compilation script
│   └── requirements.txt     # Dependencies
│
├── scripts/                  # Automation
│   ├── setup.sh            # Installation
│   └── run-demo.sh         # Start services
│
└── docs/                     # Documentation
    ├── API.md              # API endpoints
    ├── smart-contract.md   # Contract architecture
    ├── DEPLOYMENT.md       # Production setup
    ├── DEVELOPER.md        # Development guide
    ├── TESTING.md          # Testing guide
    └── TROUBLESHOOTING.md  # Problem solving
```

---

## Key Concepts

### Invoice Lifecycle

```
1. CREATE (Supplier)
   └─> Invoice in PENDING status
       └─> Assigned unique ID
       └─> ASA token created

2. FINANCE (Investor)
   └─> Invoice moves to FINANCED status
       └─> ASA transferred to financier
       └─> Funds paid to supplier
       └─> Interest rate fixed

3. SETTLE (After due date)
   └─> Invoice moves to SETTLED status
       └─> Settlement amount = principal + interest
       └─> Funds transferred to investor
       └─> Transaction recorded

4. DEFAULT (If not paid)
   └─> Invoice marked as DEFAULTED
       └─> Financier can claim loss
       └─> Reputation impact recorded
```

### Risk Scoring

The AI service evaluates 7 factors:

1. **Supplier History** (25%) - Past performance
2. **Credit Score** (20%) - Financial health
3. **Invoice Amount** (15%) - Size risk
4. **Payment Timeliness** (15%) - On-time payment ratio
5. **Due Date** (10%) - Payment term length
6. **Transaction Count** (10%) - Experience depth
7. **Default History** (5%) - Past defaults

Result: **Risk Level** (Low/Medium/High) + **Interest Rate** (3-20% annual)

---

## API Examples

### Create Invoice

```bash
curl -X POST http://localhost:3001/api/invoices \
  -H 'Content-Type: application/json' \
  -d '{
    "supplier_address": "A7XFLGFQP7VMS4GVZDNFR5H2NVNFZGMEPPPVZQMYA4QUO23RK56W2LLFQY",
    "buyer_address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HWA",
    "amount": 10000000,
    "due_date": "2026-02-28T23:59:59Z",
    "description": "Services"
  }'
```

### Get Risk Score

```bash
curl -X POST http://localhost:8000/api/score \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 10000000,
    "due_date_days": 30,
    "supplier_history_score": 0.85,
    "supplier_credit_score": 92,
    "payment_timeliness": 0.95,
    "transaction_count": 25,
    "default_history": 0
  }'
```

### Finance Invoice

```bash
curl -X POST http://localhost:3001/api/invoices/<invoice_id>/finance \
  -H 'Content-Type: application/json' \
  -d '{
    "financier_address": "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBY5HWA",
    "interest_rate": 0.1
  }'
```

---

## Next Steps

### After Getting Started

1. **Read the full README**: [README.md](../README.md)
2. **Explore API docs**: [API.md](API.md)
3. **Understand smart contracts**: [smart-contract.md](smart-contract.md)
4. **For development**: [DEVELOPER.md](DEVELOPER.md)
5. **For testing**: [TESTING.md](TESTING.md)
6. **For production**: [DEPLOYMENT.md](DEPLOYMENT.md)
7. **Having issues?**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Common Next Tasks

#### Deploy to TestNet

```bash
cd smart-contracts
python compile.py
# Follow DEPLOYMENT.md for contract deployment
```

#### Connect to Real Database

```bash
# In backend/.env:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# Or PostgreSQL:
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### Enable Authentication

Add JWT to backend:
```bash
# backend/.env:
JWT_SECRET=your-super-secret-key

# See DEVELOPER.md for implementation
```

#### Deploy to Production

Follow: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Stopping Services

### Automated Services

```bash
# Get the process IDs from run-demo.sh output
# Or find them:
ps aux | grep node
ps aux | grep python

# Kill by PID:
kill -9 <PID>

# Or, simpler - type Ctrl+C in each terminal
```

### Docker

```bash
# Stop and remove containers:
docker-compose down

# Or just stop (keep data):
docker-compose stop

# View logs while running:
docker-compose logs -f
```

---

## Performance Tips

### Development Mode

- Frontend hot-reload: Save file → Auto refresh
- Backend watch mode: `npm start` watches changes
- AI service reload: `--reload` flag auto-restarts

### Production Mode

```bash
# Frontend build
cd frontend && npm run build

# Backend production
NODE_ENV=production npm start

# AI service with gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 main:app
```

---

## Security Notes

### Development

⚠️ **NOT FOR PRODUCTION:**
- No authentication
- Hardcoded test credentials
- In-memory data (lost on restart)
- CORS allows all origins

### Before Deploying

☑️ **Configure:**
- [ ] JWT authentication
- [ ] Environment variables (don't commit .env)
- [ ] Database persistence
- [ ] CORS whitelisting
- [ ] HTTPS/SSL
- [ ] Rate limiting
- [ ] API key management
- [ ] Backup strategy

See: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Useful Commands

```bash
# Check health
curl http://localhost:3001/api/health
curl http://localhost:8000/api/health

# List invoices
curl http://localhost:3001/api/invoices

# Watch logs
tail -f logs/*.log

# Clean up
docker-compose down -v  # Remove volumes too
rm -rf backend/node_modules frontend/node_modules

# Database query
mongodbsh "mongodb://localhost:27017"

# Smart contract state
goal app read --app-id 12345
```

---

## Keyboard Shortcuts

| Combo | Action |
|-------|--------|
| `Ctrl+C` | Stop running service |
| `Ctrl+L` | Clear terminal |
| `F12` | Browser dev tools |
| `Ctrl+Shift+K` | Docker logs |
| `npm run build` | Build for production |
| `docker-compose up -d` | Run in background |

---

## Frequently Needed Files

```
Setup:        scripts/setup.sh
Start:        scripts/run-demo.sh
API Docs:     docs/API.md
Deployment:   docs/DEPLOYMENT.md
Troubleshoot: docs/TROUBLESHOOTING.md
Contract:     smart-contracts/invoice_contract.py
Frontend:     frontend/src/App.js
Backend:      backend/server.js
Config:       backend/.env
```

---

## Example Workflow in 10 Minutes

```bash
# 1. Setup (2 min)
bash scripts/setup.sh

# 2. Start services (1 min)
bash scripts/run-demo.sh

# 3. Create test invoice (2 min)
open http://localhost:3000
# Follow "Your First Invoice" section above

# 4. Verify on blockchain (2 min)
curl http://localhost:3001/api/invoices
# See your created invoice

# 5. Explore (3 min)
# Try different features in UI
# Check Analytics tab
# Create another invoice with different amount
```

---

## What Just Happened?

When you completed the quick start:

1. ✅ Created a **tokenized invoice** (ASA on blockchain)
2. ✅ Ran **risk scoring** (AI evaluated invoice)
3. ✅ **Financed the invoice** (Atomic transaction)
4. ✅ Connected Algorand wallet
5. ✅ Used **smart contracts** (All-or-nothing settlement)
6. ✅ Queried **analytics** (Real-time metrics)

You've successfully demonstrated:
- Full-stack dApp development
- Blockchain integration
- AI/ML risk assessment
- Real-time data aggregation
- Production-grade architecture

---

## Ready to Extend?

### Add New Feature (30 min)

See: [DEVELOPER.md](DEVELOPER.md) → "Adding New Features"

### Deploy to TestNet (1 hour)

See: [DEPLOYMENT.md](DEPLOYMENT.md) → "TestNet Deployment"

### Run Tests (15 min)

See: [TESTING.md](TESTING.md) → "Unit Testing"

### Deploy to Production (2 hours)

See: [DEPLOYMENT.md](DEPLOYMENT.md) → "Production Deployment"

---

## Getting Help

- **Issues**: Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **API Questions**: See [API.md](API.md)
- **Development**: Read [DEVELOPER.md](DEVELOPER.md)
- **Smart Contract**: Check [smart-contract.md](smart-contract.md)

---

## Success Checklist

- [ ] Backend running on port 3001
- [ ] Frontend accessible at localhost:3000
- [ ] AI service on port 8000
- [ ] Can connect wallet
- [ ] Can create invoice
- [ ] Can finance invoice
- [ ] Can view analytics
- [ ] All tests passing

✅ **Congratulations!** Your Invoice Financing dApp is ready!

---

**Next**: Read the full [README.md](../README.md) for comprehensive documentation.
