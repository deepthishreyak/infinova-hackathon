# Troubleshooting & FAQ

## Frequently Asked Questions

### General Questions

**Q: What blockchain does this platform use?**
A: Algorand TestNet (development) and MainNet (production). Uses Algorand Standard Assets (ASA) for invoice tokenization.

**Q: How much does it cost to use?**
A: Algorand transactions are extremely cheap (~0.001 ALGO per transaction). Financing fees are configurable (typically 3-20% annual interest).

**Q: Can I run this on a different blockchain?**
A: The smart contracts are Algorand-specific (PyTeal/TEAL). Porting to Ethereum would require rewriting in Solidity.

**Q: What wallets are supported?**
A: Pera Wallet (primary) and AlgoSigner (fallback). Both are non-custodial wallets.

**Q: Is there an admin panel?**
A: Currently no. Admin functions would need to be added via smart contract owner logic.

**Q: Can I customize the UI?**
A: Yes! Frontend is fully customizable React. Edit `frontend/src/` components and `frontend/src/index.css`.

### Deployment Questions

**Q: How do I deploy to production?**
A: Follow [DEPLOYMENT.md](DEPLOYMENT.md). Key steps: compile contract → deploy to MainNet → configure backend .env → deploy services.

**Q: What databases does this support?**
A: Currently uses in-memory Maps. Add MongoDB or PostgreSQL by implementing data layer in `backend/services/`.

**Q: What's the uptime SLA?**
A: Depends on your deployment. Algorand has 99.9%+ uptime. Your infrastructure SLA depends on cloud provider.

**Q: How do I add more users?**
A: Create Algorand accounts in Pera Wallet. Connect to dApp. No centralized registration needed.

**Q: Can I run multiple instances?**
A: Yes. Use load balancer (Nginx, AWS ALB) and shared database (MongoDB Atlas, RDS).

---

## Common Issues

### 1. Backend Won't Start

**Symptom:** `npm start` fails or gives error

**Causes:**
- Missing dependencies
- Port 3001 already in use
- Node version mismatch
- Missing .env file

**Solutions:**

```bash
# Check Node version (need 16+)
node --version

# Install dependencies
cd backend && npm install

# Check if port is in use
lsof -i :3001
# Kill process if needed: kill -9 <PID>

# Create .env file
cp .env.example .env

# Start again
npm start
```

---

### 2. Frontend Won't Load

**Symptom:** Blank page or "Cannot GET /" error

**Causes:**
- React dev server not running
- Backend not running
- Browser cache issue
- CORS error

**Solutions:**

```bash
# Check React is running on 3000
lsof -i :3000

# Restart from scratch
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start

# Check browser console for CORS errors
# Open DevTools (F12) → Console tab

# Clear cache
# Chrome: Ctrl+Shift+Delete
# Safari: Develop → Empty Web Storage
```

---

### 3. Wallet Connection Fails

**Symptom:** "Connect Wallet" button does nothing or error appears

**Causes:**
- Pera Wallet extension not installed
- Wrong network selected
- Browser compatibility issue
- CORS blocking request

**Solutions:**

```bash
# 1. Install Pera Wallet
# Chrome: https://chrome.google.com/webstore
# Firefox: https://addons.mozilla.org
# Search: "Pera Wallet" or "AlgoSigner"

# 2. Check browser console
# F12 → Console → Look for errors

# 3. Check network
# Pera: Must be on Algorand network
# TestNet or MainNet (not Betanet)

# 4. Try incognito mode
# Rule out extensions interfering

# 5. Check CORS in backend
# backend/server.js should have:
// const cors = require('cors');
// app.use(cors());
```

---

### 4. API Requests Fail

**Symptom:** 404, 500, or network errors when creating invoices

**Causes:**
- Backend not running
- Wrong API endpoint
- Invalid input data
- Database connection failed

**Solutions:**

```bash
# 1. Verify backend is running
curl http://localhost:3001/api/health

# 2. Check console logs
npm start  # Watch output for errors

# 3. Test endpoint manually
curl -X POST http://localhost:3001/api/invoices \
  -H 'Content-Type: application/json' \
  -d '{
    "supplier_address": "A7X...",
    "buyer_address": "AAA...",
    "amount": 50000000,
    "due_date": "2026-12-31T23:59:59Z",
    "description": "Test"
  }'

# 4. Check input validation
# backend/server.js has validation - update if needed
```

---

### 5. Risk Scoring Not Working

**Symptom:** "Failed to calculate risk score" error

**Causes:**
- AI service not running
- Wrong endpoint configured
- Input data missing required fields
- Timeout (slow machine)

**Solutions:**

```bash
# 1. Start AI service
cd ai-service
python -m uvicorn main:app --port 8000

# 2. Test AI service directly
curl http://localhost:8000/api/health

# 3. Test risk scoring endpoint
curl -X POST http://localhost:8000/api/score \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 50000000,
    "due_date_days": 30,
    "supplier_history_score": 0.85,
    "supplier_credit_score": 92,
    "payment_timeliness": 0.95,
    "transaction_count": 25,
    "default_history": 0
  }'

# 4. Check backend config
# backend/.env should have:
// AI_SERVICE_URL=http://localhost:8000

# 5. If AI service times out, use fallback
# Check server.js - has fallback scoring built-in
```

---

### 6. Smart Contract Deployment Fails

**Symptom:** Compilation errors or deployment rejected

**Causes:**
- PyTeal syntax error
- Algorand node unreachable
- Insufficient funds for deployment
- Contract too large

**Solutions:**

```bash
# 1. Verify PyTeal installed
pip install pyteal==0.24.1

# 2. Test compilation
cd smart-contracts
python compile.py

# 3. Check output
ls -la compiled/
# Should have: invoice_approval.teal, invoice_clearstate.teal

# 4. Verify Algorand node
# TestNet: Must have running node or use PureStake API
# Connection: Update deploy.py with correct endpoint

# 5. Check contract size
wc -l compiled/invoice_approval.teal
# Must be < 65,536 bytes

# 6. Check funds
# Need at least 0.2 ALGO for deployment + 0.1 per transaction
goal account info -a <your_address>
```

---

### 7. Docker Compose Won't Start

**Symptom:** `docker-compose up` fails

**Causes:**
- Docker not installed
- Port conflicts
- Wrong permissions
- Missing env files

**Solutions:**

```bash
# 1. Check Docker installed
docker --version
docker-compose --version

# 2. Check port availability
lsof -i :3000
lsof -i :3001
lsof -i :8000

# 3. Try verbose output
docker-compose up --verbose

# 4. Check logs of specific service
docker-compose logs backend
docker-compose logs ai-service

# 5. Rebuild images
docker-compose down
docker-compose build --no-cache
docker-compose up

# 6. Check permissions
sudo usermod -aG docker $USER
# Log out and back in

# 7. Remove containers and try fresh start
docker-compose down
docker system prune
docker-compose up
```

---

### 8. Database Connection Issues

**Symptom:** "Database connection failed" or operations timing out

**Causes:**
- MongoDB/PostgreSQL not running
- Wrong connection string
- Authentication failed
- Network firewall

**Solutions:**

```bash
# 1. Check if MongoDB is running (local)
# macOS:
brew services list | grep mongodb

# Linux:
systemctl status mongod

# 2. Test MongoDB connection
mongosh "mongodb://localhost:27017"

# 3. Check connection string in .env
# Should be: mongodb://user:pass@host:27017/database
# Can test directly: mongosh "<connection_string>"

# 4. For MongoDB Atlas (cloud)
# Whitelist your IP in Security → Network Access
# https://cloud.mongodb.com

# 5. For PostgreSQL
psql -U user -d database -h localhost

# 6. Check credentials in .env
echo $MONGODB_URI
echo $DATABASE_URL

# 7. Clear stale connections
# Restart database service
```

---

### 9. Wallet Balance Shows as Zero

**Symptom:** Can't finance invoices due to insufficient balance

**Causes:**
- Account not funded
- Wrong network (TestNet vs MainNet)
- Funds in different account
- Transaction pending

**Solutions:**

```bash
# 1. Check which network
# Pera Wallet: Account menu → Check network indicator

# 2. Get TestNet funds
# Go to https://testnet-dispenser.algorand.com/
# Paste your address
# Claim 10 TestNet ALGO

# 3. Check balance
# Pera Wallet: Shows in account view
# Command line:
goal account info -a <your_address>

# 4. For MainNet, purchase ALGO from:
# Coinbase, Kraken, Huobi, etc.

# 5. Check if in correct account
# Pera: Switch accounts from dropdown
# May have multiple accounts
```

---

### 10. Transaction Fails with "Group Size Error"

**Symptom:** Financing transaction rejected by blockchain

**Causes:**
- Atomic group has too many transactions
- Transaction ordering incorrect
- Fee calculation wrong

**Solutions:**

```bash
# This is a smart contract issue
# Solutions in backend/server.js:

# 1. Check transaction grouping is correct
# Order: ASA transfer → Payment → State update

# 2. Verify fees
# Each transaction needs fee:
// Fee = 1000 microAlgo × number of transactions

# 3. Check balance before atomics
// Financier must have enough for: 
// - Invoice amount + interest
// - Transaction fees

# 4. Enable detailed logging
// Add console.log statements in financing endpoint
// backend/server.js - financing_invoice route

# 5. Test with smaller amount first
// Try 1 ALGO before 100 ALGO
```

---

## Performance Issues

### Slow Invoice Loading

**Symptom:** Invoices take 5+ seconds to load

**Solutions:**

```javascript
// Add caching (frontend)
const [cachedInvoices, setCachedInvoices] = useState(null);
const [cacheTime, setCacheTime] = useState(null);

const fetchInvoices = async () => {
  const now = Date.now();
  if (cachedInvoices && (now - cacheTime) < 60000) {
    return cachedInvoices; // Use cache if < 1 minute old
  }
  
  const invoices = await fetch('/api/invoices').then(r => r.json());
  setCachedInvoices(invoices);
  setCacheTime(now);
  return invoices;
};

// Add pagination (backend)
// Limit results: GET /api/invoices?limit=20&offset=0

// Add database indexes
// db.invoices.createIndex({ supplier: 1 })
```

### High CPU Usage

**Symptom:** Services taking 80%+ CPU

**Solutions:**

```bash
# 1. Check what's causing it
top  # Shows processes
# or
htop  # Better UI

# 2. Check for infinite loops
# Restart services: docker-compose restart

# 3. Check AI service (uses CPU for scoring)
# Add timeout: curl --max-time 10 http://localhost:8000/api/score

# 4. Optimize risk scoring
# Cache results: Don't recalculate for same inputs
# Use simpler model: RiskScorer has 7 factors, could reduce

# 5. Monitor memory
docker stats  # Shows memory/CPU by container
```

### High Memory Usage

**Symptom:** "Out of memory" errors

**Solutions:**

```bash
# 1. Check memory limit
docker stats

# 2. Increase Docker memory
# Edit docker-compose.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G

# 3. Clear old invoices from memory
// In backend/server.js
// Set TTL on cached objects:
// invoices.delete(id) after 24 hours

# 4. Use database instead of memory
// Replace Maps with MongoDB
// Reduces memory by 100x
```

---

## Smart Contract Issues

### Contract State Corruption

**Symptom:** Invoice has conflicting data or can't be settled

**Solutions:**

```bash
# 1. Read contract state
goal app read --app-id 12345

# 2. Check all invoices
# Look for inconsistencies (status mismatch, etc.)

# 3. If corrupted, redeploy
# Create new app with fixed version
# Migrate old invoices if needed

# 4. Add validation checks
# Before settlement, verify:
// Status is FINANCED
// Amount matches original
// Due date is in past
```

---

## Security Concerns

### Account Was Compromised

**Symptom:** Unauthorized transactions on account

**Solutions:**

```bash
# 1. Don't expose private keys
# Never paste seed phrase into dApp
# Use hardware wallet if possible

# 2. Check transaction history
# Pera Wallet shows all transactions

# 3. For MainNet: freeze account if possible
# Most wallets don't support, but report to platform

# 4. Create new account
# New seed phrase
# Transfer remaining funds
```

### Invoice Data Exposed

**Symptom:** Private invoice data visible publicly

**Solutions:**

```bash
# 1. Don't store sensitive data on-chain
# Only store hashes (for privacy)

# 2. Enable IPFS encryption
# docs/smart-contract.md explains metadata hashes

# 3. Add signature verification
// Ensure invoice is from legitimate supplier
// Verify with wallet signature
```

---

## Getting More Help

### Debug Information to Gather

Before asking for help, collect:

```bash
# 1. Environment info
node --version
npm --version
python --version
docker --version

# 2. Backend logs
tail -100 backend.log

# 3. Frontend console errors
# Browser DevTools → Console tab → Screenshot

# 4. Network requests
# Browser DevTools → Network → Screenshots

# 5. Smart contract state
goal app read --app-id 12345

# 6. Blockchain status
goal node status

# 7. Service health
curl http://localhost:3001/api/health
curl http://localhost:8000/api/health
curl http://localhost:3000  # Frontend
```

### Where to Get Help

1. **GitHub Issues**: https://github.com/your-repo/issues
2. **Algorand Discord**: https://discord.gg/algorand
3. **Stack Overflow**: Tag `algorand` and `pyteal`
4. **Documentation**: Check each service's README

### Sample Issue Report

```markdown
## Issue: Wallet won't connect to dApp

### Environment
- OS: macOS 13.2
- Browser: Chrome 120
- Pera Wallet: v1.15.0
- Backend: Running on localhost:3001
- Frontend: Running on localhost:3000

### Steps to Reproduce
1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Error appears: "Extension not found"

### Expected Behavior
Wallet popup should appear for approval

### Actual Behavior
Error message, unable to connect

### Logs
[Paste browser console error message]
[Paste backend server logs]

### Attempted Solutions
- Reinstalled Pera Wallet
- Tried different browser
- Checked CORS in dev tools
```

---

For more troubleshooting: See [README.md](../README.md) or check specific docs in [docs/](.)
