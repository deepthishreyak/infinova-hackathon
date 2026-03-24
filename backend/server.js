/**
 * Production-Ready Invoice Financing Backend
 * Handles blockchain interactions, risk scoring, and transaction management
 */

const express = require('express');
const cors = require('cors');
const algosdk = require('algosdk');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================================
// ALGORAND CLIENT INITIALIZATION
// ============================================================================

const ALGOD_TOKEN = process.env.ALGOD_TOKEN || 'a'.repeat(64);
const ALGOD_SERVER = process.env.ALGOD_SERVER || 'http://localhost';
const ALGOD_PORT = process.env.ALGOD_PORT || '4001';
const INDEXER_SERVER = process.env.INDEXER_SERVER || 'http://localhost';
const INDEXER_PORT = process.env.INDEXER_PORT || '8980';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
const indexerClient = new algosdk.Indexer(ALGOD_TOKEN, INDEXER_SERVER, INDEXER_PORT);

// In-memory storage for demo (replace with database in production)
const users = new Map();
const invoices = new Map();
const pools = new Map();
const transactions = [];

// ============================================================================
// UTILITIES
// ============================================================================

async function getAlgodStatus() {
  try {
    return await algodClient.status().do();
  } catch (error) {
    throw new Error('Failed to connect to Algod: ' + error.message);
  }
}

function generateInvoiceId() {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function logTransaction(type, data) {
  transactions.push({
    timestamp: new Date(),
    type,
    data
  });
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (req, res) => {
  try {
    const status = await getAlgodStatus();
    res.json({
      status: 'healthy',
      blockchain: {
        connected: true,
        lastRound: status['last-round']
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ============================================================================
// AI RISK SCORING
// ============================================================================

app.post('/api/risk-score', async (req, res) => {
  try {
    const { 
      supplier_id, 
      amount, 
      due_date_days,
      supplier_history_score = 0.5,
      supplier_credit_score = 70
    } = req.body;

    // Validate input
    if (!supplier_id || !amount || !due_date_days) {
      return res.status(400).json({ 
        error: 'Missing required fields: supplier_id, amount, due_date_days' 
      });
    }

    // Call AI service
    try {
      const aiResponse = await axios.post('http://localhost:8000/api/score', {
        supplier_history_score,
        invoice_amount: amount,
        due_date_days,
        supplier_credit_score
      }, {
        timeout: 5000
      });

      logTransaction('RISK_SCORE', { supplier_id, amount, ...aiResponse.data });
      res.json(aiResponse.data);
    } catch (aiError) {
      // Fallback to local scoring if AI service is down
      console.warn('AI service unavailable, using fallback scoring');
      const fallbackScore = calculateFallbackScore({
        supplier_history_score,
        invoice_amount: amount,
        due_date_days,
        supplier_credit_score
      });
      res.json(fallbackScore);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function calculateFallbackScore(data) {
  let score = 0.5;

  if (data.supplier_history_score > 0.8) score += 0.2;
  else if (data.supplier_history_score < 0.3) score -= 0.3;

  if (data.invoice_amount > 50000) score -= 0.15;
  else if (data.invoice_amount < 5000) score -= 0.1;

  if (data.due_date_days < 30) score += 0.1;
  else if (data.due_date_days > 120) score -= 0.15;

  if (data.supplier_credit_score > 80) score += 0.2;
  else if (data.supplier_credit_score < 50) score -= 0.3;

  score = Math.max(0, Math.min(1, score));

  let risk = 'Medium';
  let interest_rate = 0.10;

  if (score > 0.7) {
    risk = 'Low';
    interest_rate = 0.05;
  } else if (score < 0.4) {
    risk = 'High';
    interest_rate = 0.20;
  }

  return {
    risk_score: score,
    risk_level: risk,
    interest_rate: interest_rate,
    recommended_funding_amount: Math.floor(data.invoice_amount * (1 - (1 - score) * 0.3)),
    confidence: 0.85
  };
}

// ============================================================================
// INVOICE OPERATIONS
// ============================================================================

app.post('/api/invoices', async (req, res) => {
  try {
    const { 
      supplier_address,
      buyer_address,
      amount,
      due_date,
      description
    } = req.body;

    // Validate inputs
    if (!supplier_address || !buyer_address || !amount || !due_date) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    if (!algosdk.isValidAddress(supplier_address) || !algosdk.isValidAddress(buyer_address)) {
      return res.status(400).json({ 
        error: 'Invalid Algorand address' 
      });
    }

    const invoiceId = generateInvoiceId();
    const invoice = {
      id: invoiceId,
      supplier_address,
      buyer_address,
      amount,
      due_date: new Date(due_date),
      description,
      status: 'pending',
      created_at: new Date(),
      asa_id: null,
      financing_details: null
    };

    invoices.set(invoiceId, invoice);
    logTransaction('INVOICE_CREATED', invoice);

    res.status(201).json({
      invoice_id: invoiceId,
      status: 'pending',
      message: 'Invoice created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices', (req, res) => {
  try {
    const invoiceList = Array.from(invoices.values())
      .map(inv => ({
        ...inv,
        created_at: inv.created_at.toISOString(),
        due_date: inv.due_date.toISOString()
      }));

    res.json({
      count: invoiceList.length,
      invoices: invoiceList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      due_date: invoice.due_date.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// FINANCING OPERATIONS
// ============================================================================

app.post('/api/invoices/:id/finance', async (req, res) => {
  try {
    const { financier_address, interest_rate } = req.body;
    const invoice = invoices.get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Invoice must be in pending status to finance' 
      });
    }

    if (!algosdk.isValidAddress(financier_address)) {
      return res.status(400).json({ error: 'Invalid financier address' });
    }

    if (interest_rate < 0.01 || interest_rate > 0.5) {
      return res.status(400).json({ error: 'Interest rate must be between 1% and 50%' });
    }

    // Update invoice
    invoice.status = 'financed';
    invoice.financing_details = {
      financier_address,
      interest_rate,
      financed_at: new Date(),
      settlement_amount: invoice.amount * (1 + interest_rate)
    };

    logTransaction('INVOICE_FINANCED', {
      invoice_id: req.params.id,
      financier: financier_address,
      amount: invoice.amount
    });

    res.json({
      invoice_id: req.params.id,
      status: 'financed',
      financing_details: {
        ...invoice.financing_details,
        financed_at: invoice.financing_details.financed_at.toISOString()
      },
      message: 'Invoice financed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SETTLEMENT OPERATIONS
// ============================================================================

app.post('/api/invoices/:id/settle', async (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'financed') {
      return res.status(400).json({ 
        error: 'Invoice must be financed before settlement' 
      });
    }

    const settlement_amount = invoice.financing_details.settlement_amount;

    invoice.status = 'settled';
    invoice.settled_at = new Date();

    logTransaction('INVOICE_SETTLED', {
      invoice_id: req.params.id,
      settlement_amount
    });

    res.json({
      invoice_id: req.params.id,
      status: 'settled',
      settlement_amount,
      message: 'Invoice settled successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LIQUIDITY POOL
// ============================================================================

app.post('/api/pool/deposit', (req, res) => {
  try {
    const { investor_address, amount } = req.body;

    if (!algosdk.isValidAddress(investor_address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!pools.has(investor_address)) {
      pools.set(investor_address, 0);
    }

    pools.set(investor_address, pools.get(investor_address) + amount);

    logTransaction('POOL_DEPOSIT', { investor: investor_address, amount });

    res.json({
      investor: investor_address,
      deposited: amount,
      total_balance: pools.get(investor_address),
      message: 'Deposit successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pool/:address', (req, res) => {
  try {
    if (!algosdk.isValidAddress(req.params.address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const balance = pools.get(req.params.address) || 0;

    res.json({
      investor: req.params.address,
      balance,
      available_for_financing: balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

app.get('/api/analytics', (req, res) => {
  try {
    const invoiceList = Array.from(invoices.values());
    const totalInvoices = invoiceList.length;
    const totalVolume = invoiceList.reduce((sum, inv) => sum + inv.amount, 0);
    const financedCount = invoiceList.filter(inv => inv.status === 'financed').length;
    const settledCount = invoiceList.filter(inv => inv.status === 'settled').length;

    const poolTotalBalance = Array.from(pools.values())
      .reduce((sum, balance) => sum + balance, 0);

    res.json({
      invoices: {
        total: totalInvoices,
        pending: invoiceList.filter(inv => inv.status === 'pending').length,
        financed: financedCount,
        settled: settledCount
      },
      volume: {
        total: totalVolume,
        financed: invoiceList
          .filter(inv => inv.status === 'financed' || inv.status === 'settled')
          .reduce((sum, inv) => sum + inv.amount, 0)
      },
      pool: {
        total_deposited: poolTotalBalance,
        investor_count: pools.size
      },
      roi: {
        average_interest_rate: invoiceList
          .filter(inv => inv.financing_details)
          .length > 0
          ? invoiceList
            .filter(inv => inv.financing_details)
            .reduce((sum, inv) => sum + inv.financing_details.interest_rate, 0) /
            invoiceList.filter(inv => inv.financing_details).length
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/transactions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const recentTxns = transactions.slice(-limit).reverse();

    res.json({
      count: recentTxns.length,
      transactions: recentTxns.map(txn => ({
        ...txn,
        timestamp: txn.timestamp.toISOString()
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SERVER START
// ============================================================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        Invoice Financing Backend Server Started                ║
║                                                                ║
║  Server: http://localhost:${PORT}                              ║
║  Algod: ${ALGOD_SERVER}:${ALGOD_PORT}                            ║
║  Indexer: ${INDEXER_SERVER}:${INDEXER_PORT}                        ║
║                                                                ║
║  Endpoints:                                                    ║
║  GET  /api/health              - Health check                ║
║  POST /api/invoices            - Create invoice             ║
║  GET  /api/invoices            - List invoices              ║
║  GET  /api/invoices/:id        - Get invoice details        ║
║  POST /api/invoices/:id/finance - Finance invoice           ║
║  POST /api/invoices/:id/settle  - Settle invoice            ║
║  POST /api/risk-score          - Get AI risk score          ║
║  POST /api/pool/deposit        - Deposit to liquidity pool  ║
║  GET  /api/pool/:address       - Get pool balance           ║
║  GET  /api/analytics           - Get analytics              ║
║  GET  /api/transactions        - Get transaction log        ║
║════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;