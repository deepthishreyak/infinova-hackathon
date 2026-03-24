# Developer Guide

## Project Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Blockchain Layer                         │
│              (Algorand Network + Smart Contracts)          │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┬────────────────┐
        │                  │                  │                │
┌───────▼──────┐  ┌────────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐
│ Backend API  │  │ AI Service     │  │  Database   │  │   Redis    │
│ (Node.js)    │  │ (Python/FastAPI)│  │(MongoDB/PG) │  │   Cache    │
└───────────────┘  └────────────────┘  └─────────────┘  └────────────┘
        │
        └──────────────────┬──────────────────────────────────┐
                           │                                  │
                    ┌──────▼──────┐                   ┌──────▼──────┐
                    │  Frontend    │                   │  Monitoring │
                    │  (React)     │                   │  (Sentry)   │
                    └──────────────┘                   └─────────────┘
```

## Technology Stack

### Backend (Node.js + Express)
- **Framework**: Express.js 4.18
- **Blockchain**: Algorand SDK 2.4
- **HTTP Client**: Axios
- **Database**: (MongoDB/PostgreSQL hooks)
- **Authentication**: JWT (optional)
- **Validation**: Manual input validation
- **Logging**: Console (upgradeable to Winston)

### Frontend (React)
- **Framework**: React 18.2
- **Styling**: Tailwind CSS 3.3
- **Wallet Integration**: Pera Wallet SDK
- **HTTP Client**: Fetch API
- **State Management**: React Hooks
- **Forms**: Custom form management

### AI Service (Python)
- **Framework**: FastAPI 0.104
- **Server**: Uvicorn
- **Data Validation**: Pydantic 2.0
- **ML Libraries**: Numpy (ready for expansion)
- **CORS**: Enabled

### Smart Contracts (PyTeal)
- **Language**: PyTeal 0.24 (TEAL)
- **Platform**: Algorand
- **Deployment**: AlgoKit
- **Compilation**: Python script

## Code Structure

### Backend Structure

```
backend/
├── server.js           # Main Express app
├── package.json        # Dependencies
├── .env.example        # Environment template
├── __tests__/          # Test files
│   ├── invoices.test.js
│   ├── risk.test.js
│   └── pool.test.js
├── middleware/         # Express middleware
│   ├── auth.js        # JWT validation
│   ├── rateLimit.js   # Rate limiting
│   └── errorHandler.js # Error handling
├── models/            # Data models
│   ├── Invoice.js
│   ├── User.js
│   └── Transaction.js
├── routes/            # API routes
│   ├── invoices.js
│   ├── risk.js
│   └── pool.js
├── services/          # Business logic
│   ├── invoiceService.js
│   ├── riskService.js
│   └── blockchainService.js
└── utils/             # Utilities
    ├── validation.js
    ├── logger.js
    └── constants.js
```

### Frontend Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js         # Root component
│   ├── index.js       # Entry point
│   ├── index.css      # Custom styles
│   ├── components/    # React components
│   │   ├── WalletConnect.js
│   │   ├── SupplierPanel.js
│   │   ├── InvestorPanel.js
│   │   └── Analytics.js
│   ├── hooks/         # Custom hooks
│   │   ├── useWallet.js
│   │   ├── useInvoices.js
│   │   └── useRiskScore.js
│   ├── services/      # API calls
│   │   ├── api.js     # HTTP client
│   │   └── blockchain.js
│   └── utils/         # Utilities
│       ├── formatting.js
│       └── validation.js
└── package.json
```

### AI Service Structure

```
ai-service/
├── main.py            # FastAPI app
├── requirements.txt   # Dependencies
├── .env.example       # Environment template
├── models/
│   ├── invoice.py     # Pydantic models
│   └── response.py
├── services/
│   ├── scorer.py      # Risk scoring logic
│   └── validator.py
└── tests/
    └── test_scorer.py
```

### Smart Contracts

```
smart-contracts/
├── invoice_contract.py  # Main contract code
├── compile.py           # Compilation script
├── deploy.py            # Deployment script
├── requirements.txt
├── compiled/            # Output directory
│   ├── invoice_approval.teal
│   └── invoice_clearstate.teal
└── tests/
    └── test_contract.py
```

## Key Modules

### Backend: invoices.js Route

```javascript
// GET /api/invoices - List invoices
// POST /api/invoices - Create invoice
// GET /api/invoices/:id - Get details
// POST /api/invoices/:id/finance - Finance invoice
// POST /api/invoices/:id/settle - Settle invoice

const router = express.Router();

router.get('/', (req, res) => {
  // Filter, paginate, return invoices
});

router.post('/', (req, res) => {
  // Validate input
  // Create invoice
  // Return invoice_id
});

module.exports = router;
```

### Frontend: SupplierPanel Component

```javascript
import React, { useState } from 'react';

export default function SupplierPanel({ userAddress }) {
  const [invoices, setInvoices] = useState([]);
  const [formData, setFormData] = useState({
    buyer: '',
    amount: '',
    dueDate: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate
    // API call
    // Update state
  };

  return (
    <div>
      {/* Form */}
      {/* Invoice list */}
    </div>
  );
}
```

### AI Service: RiskScorer Class

```python
from pydantic import BaseModel
from fastapi import FastAPI

class InvoiceData(BaseModel):
    amount: int
    due_date_days: int
    supplier_history_score: float
    # ... other fields

class RiskScorer:
    def calculate_risk_score(self, data: dict) -> dict:
        # Calculate 7 factors
        # Weight them
        # Return result
        pass
```

### Smart Contract: Key Functions

```python
@Subroutine(TealType.none)
def create_invoice_asa(amount: Expr, invoice_id: Expr) -> Expr:
    # Create ASA for invoice
    # Store state
    # Return ASA ID
    pass

def approval_program() -> Expr:
    # Main contract logic
    # Route by operation
    pass
```

## Adding New Features

### Adding an Invoice Field

1. **Update Smart Contract**
```python
# In invoice_contract.py, add global state key
INVOICE_METADATA_KEY = Bytes("inv_metadata_")

# Update create_invoice() to store new field
def create_invoice_asa(amount, invoice_id, metadata):
    return Seq([
        App.globalPut(Concat(INVOICE_METADATA_KEY, invoice_id), metadata)
    ])
```

2. **Update Backend Model**
```javascript
// In backend/models/Invoice.js
const Invoice = {
  id: String,
  supplier_address: String,
  buyer_address: String,
  amount: Number,
  due_date: Date,
  description: String,  // NEW FIELD
  status: String,
  // ... other fields
};
```

3. **Update API Endpoint**
```javascript
// In backend/routes/invoices.js
app.post('/api/invoices', (req, res) => {
  const { supplier_address, buyer_address, amount, due_date, description } = req.body;
  
  // Validate all fields including new one
  if (!description) {
    return res.status(400).json({ error: 'Description required' });
  }
  
  // Create invoice with new field
  invoices.set(id, { 
    ..., 
    description 
  });
});
```

4. **Update Frontend Form**
```javascript
// In frontend/src/components/SupplierPanel.js
const [formData, setFormData] = useState({
  buyer: '',
  amount: '',
  dueDate: '',
  description: ''  // NEW FIELD
});

return (
  <form>
    {/* ... other fields ... */}
    <input
      type="text"
      placeholder="Invoice description"
      value={formData.description}
      onChange={(e) => setFormData({...formData, description: e.target.value})}
    />
  </form>
);
```

5. **Update API Call**
```javascript
// In frontend/src/services/api.js
export async function createInvoice(invoiceData) {
  const response = await fetch('http://localhost:3001/api/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supplier_address: invoiceData.supplier,
      buyer_address: invoiceData.buyer,
      amount: invoiceData.amount,
      due_date: invoiceData.dueDate,
      description: invoiceData.description  // NEW FIELD
    })
  });
  return response.json();
}
```

### Adding a New Endpoint

1. **Create Route File** (backend/routes/newFeature.js)
```javascript
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  // Implementation
});

router.post('/', (req, res) => {
  // Implementation
});

module.exports = router;
```

2. **Register Route** (backend/server.js)
```javascript
app.use('/api/new-feature', require('./routes/newFeature'));
```

3. **Add Frontend Service** (frontend/src/services/api.js)
```javascript
export async function getNewFeatureData() {
  const response = await fetch('http://localhost:3001/api/new-feature');
  return response.json();
}
```

4. **Add Frontend Component** (frontend/src/components/NewFeature.js)
```javascript
import React, { useEffect, useState } from 'react';
import { getNewFeatureData } from '../services/api';

export default function NewFeature() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    getNewFeatureData().then(setData);
  }, []);
  
  return <div>{JSON.stringify(data)}</div>;
}
```

### Adding a Risk Scoring Factor

1. **Update AI Service** (ai-service/main.py)
```python
class RiskScorer:
    def score_new_factor(self, value: float) -> float:
        """Score the new factor"""
        # Implementation
        return score
    
    def calculate_risk_score(self, data: dict) -> dict:
        # Add new factor
        new_factor_weight = 0.05  # 5% weight
        new_factor_score = self.score_new_factor(data['new_field'])
        
        # Recalculate weighted average
        # ... update weights to sum to 1.0
```

2. **Update API Response** (ai-service/main.py)
```python
class RiskScoreResponse(BaseModel):
    risk_score: float
    risk_level: str
    interest_rate_bps: int
    confidence: float
    factors: dict
    new_factor: dict  # NEW FACTOR
    timestamp: datetime
```

3. **Update Frontend Display** (frontend/src/components/InvestorPanel.js)
```javascript
{riskScore && (
  <div className="risk-factors">
    {/* ... existing factors ... */}
    <div>
      <strong>New Factor:</strong> {riskScore.new_factor.score}
    </div>
  </div>
)}
```

## Testing Your Changes

### Unit Test Example

```javascript
// backend/__tests__/newFeature.test.js
const request = require('supertest');
const app = require('../server');

describe('New Feature', () => {
  test('GET /api/new-feature returns data', async () => {
    const response = await request(app).get('/api/new-feature');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

### Integration Test Example

```javascript
// Test the full feature flow
test('Create invoice → Calculate risk → Finance flow', async () => {
  // 1. Create invoice
  const invoice = await createInvoice({...});
  expect(invoice.id).toBeDefined();
  
  // 2. Get risk score
  const risk = await getRiskScore({...});
  expect(risk.risk_score).toBeGreaterThan(0);
  
  // 3. Finance invoice
  const financed = await financeInvoice(invoice.id, {...});
  expect(financed.status).toBe('financed');
});
```

### Manual Testing

```bash
# 1. Start all services
docker-compose up

# 2. Test endpoint
curl http://localhost:3001/api/new-feature

# 3. Check browser console for errors
open http://localhost:3000

# 4. Verify database state
mongodbsh "mongodb srv://..."
```

## Common Development Patterns

### Error Handling

```javascript
// Consistent error handling pattern
try {
  // Operation
  const result = operation();
  
  // Validation
  if (!result) {
    return res.status(400).json({ error: 'Validation failed' });
  }
  
  // Success response
  res.json({ data: result });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
```

### Async Operations

```javascript
// Frontend async pattern
const handleAsync = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const data = await fetchData();
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Form Validation

```javascript
// Standard validation pattern
const validateForm = (data) => {
  const errors = {};
  
  if (!data.amount || data.amount <= 0) {
    errors.amount = 'Amount must be > 0';
  }
  
  if (!data.address || data.address.length !== 58) {
    errors.address = 'Invalid Algorand address';
  }
  
  return errors;
};
```

## Debugging

### Enable Debug Logging

```bash
# Backend
DEBUG=* npm start

# Frontend
REACT_APP_DEBUG=true npm start

# AI Service
export LOG_LEVEL=debug
python -m uvicorn main:app
```

### Browser DevTools

```javascript
// In frontend/src/index.js
if (process.env.REACT_APP_DEBUG) {
  window.__DEBUG__ = {
    state: applicationState
  };
}

// In browser console
window.__DEBUG__.state
```

### Smart Contract Debugging

```bash
# Print contract state
goal app read --app-id 12345

# Simulate transaction
goal clerk send --from-program approval.teal --to receiver --amount 1000000
```

## Performance Optimization

### Frontend Optimization

```javascript
// Memoization
import React, { memo, useMemo } from 'react';

const InvoiceItem = memo(({ invoice }) => {
  return <div>{invoice.id}</div>;
});

// Lazy loading
import { lazy, Suspense } from 'react';
const Analytics = lazy(() => import('./Analytics'));

<Suspense fallback={<div>Loading...</div>}>
  <Analytics />
</Suspense>
```

### Backend Optimization

```javascript
// Query optimization
// Use indexes for frequently queried fields
db.invoices.createIndex({ supplier: 1, status: 1 });

// Caching
const cache = new Map();

app.get('/api/invoices/:id', (req, res) => {
  const cached = cache.get(req.params.id);
  if (cached) return res.json(cached);
  
  const invoice = invoices.get(req.params.id);
  cache.set(req.params.id, invoice);
  res.json(invoice);
});
```

## Documentation

When adding new features, document:

1. **README.md** - High-level overview
2. **docs/API.md** - New endpoints
3. **docs/smart-contract.md** - Contract changes
4. **Code comments** - Complex logic
5. **Tests** - Usage examples

Example documentation:

```markdown
## New Feature: Invoice Insurance

### Overview
Users can purchase insurance for invoices to protect against default.

### API Endpoint
POST /api/invoices/:id/insurance
```

## Getting Help

### Useful Resources

- [Algorand Developer Docs](https://developer.algorand.org)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [FastAPI Tutorial](https://fastapi.tiangolo.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Debugging Help

1. Check logs: `tail -f logs/*.log`
2. Check blockchain: `goal account info -a <address>`
3. Check API: `curl http://localhost:3001/api/health`
4. Check database: `mongodbsh`, `psql`

---

For specific questions, check [docs/](.) or open an issue on GitHub.
