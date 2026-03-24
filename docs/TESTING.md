# Testing & Quality Assurance Guide

## Overview

This guide provides comprehensive testing procedures for all components of the Invoice Financing platform.

## Unit Testing

### Backend API Tests

**Location:** `backend/__tests__/`

Install testing framework:
```bash
cd backend
npm install --save-dev jest supertest
```

**Test Structure:**
```javascript
// backend/__tests__/invoices.test.js
describe('Invoice API', () => {
  test('POST /api/invoices creates invoice', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .send({
        supplier_address: 'A7XFLGFQP7VMS4GVZDNFR5H2NVNFZGMEPPPVZQMYA4QUO23RK56W2LLFQY',
        buyer_address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HWA',
        amount: 50000000,
        due_date: '2026-12-31T23:59:59Z',
        description: 'Test invoice'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('invoice_id');
    expect(response.body.status).toBe('pending');
  });
  
  test('GET /api/invoices lists invoices', async () => {
    const response = await request(app).get('/api/invoices');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.invoices)).toBe(true);
  });
  
  test('POST /api/invoices/:id/finance finances invoice', async () => {
    // Create invoice first
    const createRes = await request(app)
      .post('/api/invoices')
      .send({ /* invoice data */ });
    
    const invoiceId = createRes.body.invoice_id;
    
    // Finance it
    const response = await request(app)
      .post(`/api/invoices/${invoiceId}/finance`)
      .send({
        financier_address: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBY5HWA',
        interest_rate: 0.1
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('financed');
  });
});
```

### Smart Contract Tests

**Location:** `smart-contracts/__tests__/`

Install PyTest:
```bash
pip install pytest pytest-asyncio
```

**Test Structure:**
```python
# smart-contracts/__tests__/test_contract.py
import pytest
from algosdk import encoding, account
from invoice_contract import approval_program, clear_state_program

class TestInvoiceContract:
    def test_approval_program_compiles(self):
        """Test that approval program compiles without errors"""
        ap = approval_program()
        assert ap is not None
    
    def test_clear_state_compiles(self):
        """Test that clear state program compiles"""
        cp = clear_state_program()
        assert cp is not None
    
    def test_byteslice_formatting(self):
        """Test address formatting"""
        addr = "A7XFLGFQP7VMS4GVZDNFR5H2NVNFZGMEPPPVZQMYA4QUO23RK56W2LLFQY"
        decoded = encoding.decode_address(addr)
        assert len(decoded) == 32
```

### AI Service Tests

**Location:** `ai-service/test_main.py`

```python
import pytest
from main import RiskScorer

class TestRiskScorer:
    def test_score_supplier_history(self):
        """Test supplier history scoring"""
        scorer = RiskScorer()
        score = scorer.score_supplier_history(0.85)
        assert 0 <= score <= 1
    
    def test_score_credit_score(self):
        """Test credit score calculation"""
        scorer = RiskScorer()
        score = scorer.score_credit_score(92)
        assert score == 0.92
    
    def test_risk_score_calculation(self):
        """Test full risk score calculation"""
        scorer = RiskScorer()
        data = {
            "amount": 50000000,
            "due_date_days": 30,
            "supplier_history_score": 0.85,
            "supplier_credit_score": 92,
            "payment_timeliness": 0.95,
            "transaction_count": 25,
            "default_history": 0
        }
        result = scorer.calculate_risk_score(data)
        assert 0 <= result['risk_score'] <= 1
        assert result['risk_level'] in ['Low', 'Medium', 'High']
```

## Integration Testing

### End-to-End Workflow

**Test scenario:** Complete invoice lifecycle from creation to settlement

```bash
# 1. Start backend
npm start --prefix backend &
BACKEND_PID=$!

# 2. Start AI service
python -m uvicorn main:app --port 8000 --prefix ai-service &
AI_PID=$!

# 3. Run tests
npm test --prefix backend

# 4. Cleanup
kill $BACKEND_PID $AI_PID
```

### Test Data

**Invoice creation test:**
```json
{
  "supplier_address": "A7XFLGFQP7VMS4GVZDNFR5H2NVNFZGMEPPPVZQMYA4QUO23RK56W2LLFQY",
  "buyer_address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HWA",
  "amount": 50000000,
  "due_date": "2026-12-31T23:59:59Z",
  "description": "Services rendered"
}
```

**Financing test:**
```json
{
  "financier_address": "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBY5HWA",
  "interest_rate": 0.1
}
```

## Functional Testing Checklist

### Frontend
- [ ] Wallet connection (Pera and AlgoSigner)
- [ ] Invoice creation with validation
- [ ] Invoice list pagination
- [ ] Risk score display
- [ ] Financing workflow
- [ ] Analytics dashboard loads
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Error messages display correctly
- [ ] Loading states show progress

### Backend
- [ ] Health check returns 200
- [ ] Invoice CRUD operations work
- [ ] Financing updates invoice status
- [ ] Settlement calculates interest correctly
- [ ] Risk scoring integrates with AI service
- [ ] Pool operations track balances
- [ ] Analytics aggregates correct metrics
- [ ] Error responses are formatted correctly

### Smart Contract
- [ ] Invoice creation generates ASA
- [ ] Finance operation executes atomically
- [ ] Settlement transfers correct amount
- [ ] Default marking works for expired invoices
- [ ] Pool balance updates correctly
- [ ] State consistency maintained

## Performance Testing

### Load Testing with Apache Bench

```bash
# 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:3001/api/invoices

# Expected: <200ms response time for GET
```

### Database Query Performance

```javascript
// Measure invoice lookup time
console.time('invoice_lookup');
const invoice = invoices.get(invoice_id);
console.timeEnd('invoice_lookup');

// Expected: <1ms
```

### AI Service Latency

```python
import time

start = time.time()
score = scorer.calculate_risk_score(data)
latency = (time.time() - start) * 1000

print(f"Risk scoring latency: {latency:.0f}ms")
# Expected: <500ms
```

## Security Testing

### Input Validation

- [ ] Invalid Algorand addresses rejected
- [ ] Negative amounts rejected
- [ ] Past due dates rejected
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] CSRF tokens validated

### Smart Contract Security

- [ ] Reentrancy prevention verified
- [ ] Overflow/underflow prevention checked
- [ ] Access control enforced
- [ ] State consistency maintained

### API Security

- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] Error messages don't expose internals
- [ ] Rate limiting (if implemented)

## Manual Testing Scenarios

### Scenario 1: Complete Invoice Workflow

1. Connect wallet (Pera)
2. Create invoice as supplier
   - Buyer: Test account A
   - Amount: 10 ALGO
   - Due date: 30 days
3. Switch to investor wallet
4. View invoice in InvestorPanel
5. Get risk score
6. Finance invoice with 5% interest
7. Verify settlement amount (10.5 ALGO)
8. Wait for due date (or fast-forward in dev)
9. Settle invoice
10. Verify funds transferred

### Scenario 2: Risk Scoring Variation

1. Create 5 invoices with different profiles:
   - High credit supplier: Should get 3-5% interest
   - Low credit supplier: Should get 15-20% interest
   - Large amount: Should get higher interest
   - Long payment term: Should get lower interest
2. Verify risk scores are differentiated
3. Verify interest rates align with risk

### Scenario 3: Pool Management

1. Investor deposits 50 ALGO
2. Investor withdraws 10 ALGO
3. Two suppliers request financing
4. Verify pool balance decreases
5. Verify investors get paid from pool

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: npm install
      - run: npm test
      - run: pip install -r ai-service/requirements.txt
      - run: pytest ai-service/
```

## Known Issues & Limitations

### Current Known Issues
- In-memory data not persisted between restarts
- No rate limiting implemented
- No authentication/authorization
- AI service runs synchronously (no queue)

### Testing Limitations
- Can't test real Algorand transactions (use TestNet)
- AI service may timeout on slow machines
- Frontend tests require browser environment

## Reporting Test Results

### Test Report Template

```markdown
## Test Report - Date: YYYY-MM-DD

### Environment
- Node: v18.0.0
- Python: 3.10.0
- Algorand: TestNet
- Browser: Chrome 120

### Results Summary
- Total Tests: 45
- Passed: 43
- Failed: 2
- Skipped: 0
- Coverage: 87%

### Failed Tests
1. test_settlement_with_large_interest_rate
   - Error: Interest overflow
   - Fix: Implement big number library

### Performance
- Avg Response Time: 142ms
- Max Response Time: 890ms
- Throughput: 70 req/sec

### Security
- [ ] OWASP Top 10 checked
- [ ] No vulnerabilities found
- [ ] All inputs validated

### Recommendations
1. Implement database persistence
2. Add rate limiting
3. Increase test coverage to 95%
```

## Continuous Monitoring (Post-Deployment)

### Metrics to Track
- API latency (p50, p95, p99)
- Error rate by endpoint
- Blockchain transaction success rate
- Smart contract call costs
- Risk scoring accuracy (vs. actual defaults)
- Liquidity pool utilization

### Alerting Thresholds
- Error rate > 5%
- Latency p95 > 2 seconds
- Service downtime > 5 minutes
- Smart contract execution cost spikes

### Log Aggregation

```
Application logs → ELK Stack → Kibana Dashboard
Blockchain logs → Custom parser → Grafana
```

---

For more info on testing best practices: [Jest Documentation](https://jestjs.io/), [PyTest Docs](https://pytest.org/)
