# API Reference

## Base URL
```
http://localhost:3001
```

## Authentication
All endpoints are currently open. For production, add JWT token auth:
```
Authorization: Bearer <jwt_token>
```

---

## Invoices

### Create Invoice
**POST** `/api/invoices`

Create a new tokenized invoice.

**Request Body:**
```json
{
  "supplier_address": "A7XFLGFQP7VMS4GVZDNFR5H2NVNFZGMEPPPVZQMYA4QUO23RK56W2LLFQY",
  "buyer_address": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HWA",
  "amount": 50000000,
  "due_date": "2026-12-31T23:59:59Z",
  "description": "Services rendered Q4 2026"
}
```

**Response (201 Created):**
```json
{
  "invoice_id": "INV-1703001234-abc123def",
  "status": "pending",
  "message": "Invoice created successfully"
}
```

**Error Responses:**
- `400`: Missing required fields or invalid format
- `500`: Server error creating invoice

---

### List All Invoices
**GET** `/api/invoices`

Retrieve all invoices.

**Query Parameters:**
- `status` (optional): Filter by status (pending, financed, settled)
- `supplier` (optional): Filter by supplier address
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "count": 2,
  "invoices": [
    {
      "id": "INV-1703001234-abc123def",
      "supplier_address": "A7X...",
      "buyer_address": "AAA...",
      "amount": 50000000,
      "due_date": "2026-12-31T23:59:59Z",
      "status": "pending",
      "created_at": "2026-01-15T10:30:00Z"
    },
    ...
  ]
}
```

---

### Get Invoice Details
**GET** `/api/invoices/:id`

Retrieve specific invoice details.

**Response (200 OK):**
```json
{
  "id": "INV-1703001234-abc123def",
  "supplier_address": "A7X...",
  "buyer_address": "AAA...",
  "amount": 50000000,
  "due_date": "2026-12-31T23:59:59Z",
  "status": "financed",
  "created_at": "2026-01-15T10:30:00Z",
  "asa_id": 12345,
  "financing_details": {
    "financier_address": "BBB...",
    "interest_rate": 0.1,
    "financed_at": "2026-01-20T14:22:00Z",
    "settlement_amount": 55000000
  }
}
```

---

### Finance Invoice
**POST** `/api/invoices/:id/finance`

Finance an invoice and execute atomic transfers.

**Request Body:**
```json
{
  "financier_address": "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBY5HWA",
  "interest_rate": 0.1
}
```

**Response (200 OK):**
```json
{
  "invoice_id": "INV-1703001234-abc123def",
  "status": "financed",
  "financing_details": {
    "financier_address": "BBB...",
    "interest_rate": 0.1,
    "financed_at": "2026-01-20T14:22:00Z",
    "settlement_amount": 55000000
  },
  "message": "Invoice financed successfully"
}
```

**Error Responses:**
- `400`: Invalid interest rate or invoice already financed
- `404`: Invoice not found
- `500`: Financing operation failed

---

### Settle Invoice
**POST** `/api/invoices/:id/settle`

Settle an invoice and pay financier.

**Response (200 OK):**
```json
{
  "invoice_id": "INV-1703001234-abc123def",
  "status": "settled",
  "settlement_amount": 55000000,
  "message": "Invoice settled successfully"
}
```

---

## Risk Scoring

### Calculate Risk Score
**POST** `/api/risk-score`

Get AI-generated risk assessment and interest rate recommendation.

**Request Body:**
```json
{
  "supplier_id": "A7X...",
  "amount": 50000000,
  "due_date_days": 30,
  "supplier_history_score": 0.85,
  "supplier_credit_score": 92
}
```

**Response (200 OK):**
```json
{
  "risk_score": 0.82,
  "risk_level": "Low",
  "interest_rate_bps": 500,
  "interest_rate_percent": 0.05,
  "recommended_funding_amount": 47500000,
  "confidence": 0.92,
  "factors": {
    "supplier_history": {
      "score": 0.85,
      "factor": "Good supplier history"
    },
    "credit_score": {
      "score": 92,
      "factor": "Excellent credit score"
    },
    "invoice_amount": {
      "amount": 50000000,
      "factor": "Low amount"
    },
    "payment_timeliness": {
      "timeliness": 0.95,
      "factor": "Excellent payment timeliness"
    },
    "due_date": {
      "days": 30,
      "factor": "Short payment term"
    },
    "transaction_count": {
      "count": 25,
      "factor": "Good transaction history"
    },
    "default_history": {
      "defaults": 0,
      "factor": "No defaults"
    }
  },
  "timestamp": "2026-01-20T14:22:00Z"
}
```

---

## Liquidity Pool

### Deposit to Pool
**POST** `/api/pool/deposit`

Investor deposits Algos into liquidity pool.

**Request Body:**
```json
{
  "investor_address": "CCC...",
  "amount": 100000000
}
```

**Response (200 OK):**
```json
{
  "investor": "CCC...",
  "deposited": 100000000,
  "total_balance": 250000000,
  "message": "Deposit successful"
}
```

---

### Get Pool Balance
**GET** `/api/pool/:address`

Check investor's pool balance.

**Response (200 OK):**
```json
{
  "investor": "CCC...",
  "balance": 250000000,
  "available_for_financing": 250000000
}
```

---

## Analytics

### Get Platform Analytics
**GET** `/api/analytics`

Comprehensive platform statistics and metrics.

**Response (200 OK):**
```json
{
  "invoices": {
    "total": 45,
    "pending": 12,
    "financed": 28,
    "settled": 5
  },
  "volume": {
    "total": 2250000000,
    "financed": 1400000000
  },
  "pool": {
    "total_deposited": 500000000,
    "investor_count": 12
  },
  "roi": {
    "average_interest_rate": 0.085
  }
}
```

---

### Get Transaction Log
**GET** `/api/transactions`

Recent transaction activity.

**Query Parameters:**
- `limit` (optional): Number of transactions (default: 50)
- `type` (optional): Filter by type (INVOICE_CREATED, INVOICE_FINANCED, etc.)

**Response (200 OK):**
```json
{
  "count": 15,
  "transactions": [
    {
      "timestamp": "2026-01-20T14:22:00Z",
      "type": "INVOICE_FINANCED",
      "data": {
        "invoice_id": "INV-1703001234-abc123def",
        "financier": "BBB...",
        "amount": 50000000
      }
    },
    ...
  ]
}
```

---

## Health & Status

### Health Check
**GET** `/api/health`

Check API and blockchain connection status.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "blockchain": {
    "connected": true,
    "lastRound": 31000000
  }
}
```

---

## Error Handling

### Standard Error Response
**Status: 400-500**
```json
{
  "error": "Error message describing what went wrong",
  "timestamp": "2026-01-20T14:22:00Z"
}
```

### Common Errors

| Code | Message | Solution |
|------|---------|----------|
| 400 | Invalid Algorand address | Verify address format (58 chars, starts with A) |
| 400 | Invalid amount | Amount must be > 0 |
| 404 | Invoice not found | Check invoice ID is correct |
| 400 | Invoice not in pending status | Invoice already financed or settled |
| 500 | Internal server error | Check backend logs |
| 503 | Algorand node unreachable | Ensure node is running |

---

## Rate Limiting

Current implementation has no rate limits (dev mode). Production should implement:
- 100 requests/minute per IP
- 10 concurrent requests per IP
- Exponential backoff for retries

---

## Pagination

All list endpoints support pagination:
```
GET /api/invoices?limit=20&offset=40
```

Returns items 40-59 (0-indexed).

---

## Filtering & Sorting

Supported filter parameters:
- `status`: pending, financed, settled
- `min_amount`: Filter by minimum amount
- `max_amount`: Filter by maximum amount
- `due_after`: Filter by due date (ISO format)
- `due_before`: Filter by due date (ISO format)

Example:
```
GET /api/invoices?status=pending&min_amount=1000000&due_before=2026-12-31
```

---

## Webhooks (Future)

Coming in v2.0:
- Invoice created
- Invoice financed
- Invoice settled
- Invoice defaulted
- Pool updated

---

## Client Libraries

Recommended clients:
- **JavaScript/TypeScript**: axios, fetch API
- **Python**: requests, httpx
- **Go**: net/http

Example JavaScript:
```javascript
const response = await fetch('http://localhost:3001/api/invoices', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-20 | Initial release |
| 1.1.0 | 2026-02-15 | Added filtering, pagination |
| 1.2.0 | 2026-03-30 | Added analytics endpoints |

---

For more info: [Full API Documentation](https://docs.invoiceflow.io)
