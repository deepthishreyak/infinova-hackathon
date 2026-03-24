/**
 * Investor Panel Component
 * Allows investors to browse, fund invoices, and earn returns
 */

import React, { useState, useEffect } from 'react';

function InvestorPanel({ userAddress }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [poolBalance, setPoolBalance] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [financingData, setFinancingData] = useState({
    amount: '',
    interest_rate: '',
  });

  useEffect(() => {
    if (userAddress) {
      loadInvoices();
      loadPoolBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/invoices');
      const data = await response.json();
      setInvoices(
        (data.invoices || []).filter((inv) => inv.status === 'pending')
      );
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPoolBalance = async () => {
    if (!userAddress) return;
    try {
      const response = await fetch(
        `http://localhost:3001/api/pool/${userAddress}`
      );
      const data = await response.json();
      setPoolBalance(data.balance || 0);
    } catch (err) {
      console.error('Error loading pool balance:', err);
    }
  };

  const handleSelectInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setError('');

    // Get risk score for this invoice
    try {
      const response = await fetch('http://localhost:3001/api/risk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: invoice.supplier_address,
          amount: invoice.amount,
          due_date_days: Math.ceil(
            (new Date(invoice.due_date) - new Date()) / (1000 * 60 * 60 * 24)
          ),
          supplier_history_score: 0.7,
          supplier_credit_score: 75,
        }),
      });

      const data = await response.json();
      setRiskScore(data);
      setFinancingData({
        amount: Math.floor(invoice.amount * 0.9),
        interest_rate: (data.interest_rate_percent * 100).toFixed(2),
      });
    } catch (err) {
      setError('Failed to fetch risk score');
      console.error(err);
    }
  };

  const handleFinanceInvoice = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!financingData.amount || !financingData.interest_rate) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      // First, deposit to pool if needed
      if (poolBalance < financingData.amount) {
        const depositResponse = await fetch(
          'http://localhost:3001/api/pool/deposit',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              investor_address: userAddress,
              amount: financingData.amount,
            }),
          }
        );

        if (!depositResponse.ok) {
          throw new Error('Failed to deposit to pool');
        }
      }

      // Then finance the invoice
      const financeResponse = await fetch(
        `http://localhost:3001/api/invoices/${selectedInvoice.id}/finance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            financier_address: userAddress,
            interest_rate: parseInt(financingData.interest_rate) / 100,
          }),
        }
      );

      if (!financeResponse.ok) {
        throw new Error('Failed to finance invoice');
      }

      const data = await financeResponse.json();
      setSuccess(
        `Invoice financed successfully! Settlement: ${(
          data.financing_details.settlement_amount / 1_000_000
        ).toFixed(3)} ALGO`
      );

      setSelectedInvoice(null);
      setRiskScore(null);

      setTimeout(() => {
        loadInvoices();
        loadPoolBalance();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Error financing invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositToPool = async () => {
    const amount = prompt('Enter amount to deposit (ALGO):');
    if (!amount) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/pool/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_address: userAddress,
          amount: parseInt(parseFloat(amount) * 1_000_000),
        }),
      });

      if (!response.ok) throw new Error('Failed to deposit');

      setSuccess(`Deposited ${amount} ALGO to your pool`);
      loadPoolBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">
          💰 Investor Dashboard
        </h2>
        <p className="text-gray-400">
          Browse and fund invoices, earn returns
        </p>
      </div>

      {/* Pool Balance Card */}
      <div className="glass p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-400 mb-2">Liquidity Pool Balance</p>
            <h3 className="text-3xl font-bold gradient-text">
              {(poolBalance / 1_000_000).toFixed(3)} ALGO
            </h3>
          </div>
          <button
            onClick={handleDepositToPool}
            disabled={loading}
            className="btn-primary"
          >
            Add Funds
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          ✕ {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          ✓ {success}
        </div>
      )}

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass p-8 rounded-lg max-w-md w-full space-y-6">
            <h3 className="text-2xl font-bold text-white">Finance Invoice</h3>

            {/* Invoice Info */}
            <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Invoice ID</p>
                <p className="font-mono text-sm text-white break-all">
                  {selectedInvoice.id}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Amount</p>
                <p className="text-blue-400 font-bold">
                  {(selectedInvoice.amount / 1_000_000).toFixed(3)} ALGO
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Due Date</p>
                <p className="text-white">
                  {new Date(selectedInvoice.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Risk Score */}
            {riskScore && (
              <div className="space-y-3 bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg">
                <h4 className="font-bold text-white">Risk Assessment</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400">Risk Level</p>
                    <span
                      className={`badge ${
                        riskScore.risk_level === 'Low'
                          ? 'badge-success'
                          : riskScore.risk_level === 'Medium'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {riskScore.risk_level}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-400">Score</p>
                    <p className="text-purple-300 font-bold">
                      {(riskScore.risk_score * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Suggested Rate</p>
                    <p className="text-green-400 font-bold">
                      {riskScore.interest_rate_percent * 100}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Max Funding</p>
                    <p className="text-white font-bold text-sm">
                      {(
                        riskScore.recommended_funding_amount / 1_000_000
                      ).toFixed(3)}{' '}
                      ALGO
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Financing Form */}
            <form onSubmit={handleFinanceInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Financing Amount (ALGO)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={
                    financingData.amount
                      ? (financingData.amount / 1_000_000).toFixed(3)
                      : ''
                  }
                  onChange={(e) =>
                    setFinancingData({
                      ...financingData,
                      amount: parseInt(parseFloat(e.target.value) * 1_000_000),
                    })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="50"
                  value={financingData.interest_rate}
                  onChange={(e) =>
                    setFinancingData({
                      ...financingData,
                      interest_rate: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Finance Invoice'}
              </button>
            </form>

            <button
              onClick={() => {
                setSelectedInvoice(null);
                setRiskScore(null);
              }}
              className="w-full btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Invoices Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Available Invoices</h3>
        {loading && invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border border-blue-500 border-t-transparent mb-4"></div>
            <p>Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center bg-gray-800/30 border border-gray-700 rounded-lg text-gray-400">
            No invoices available for financing at the moment.
          </div>
        ) : (
          <div className="responsive-grid">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="card-hover group"
              >
                <div>
                  <h4 className="font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {invoice.id.substring(0, 20)}...
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount</span>
                      <span className="text-blue-400 font-semibold">
                        {(invoice.amount / 1_000_000).toFixed(3)} ALGO
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Due</span>
                      <span className="text-white">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Days Left</span>
                      <span className="text-yellow-400">
                        {Math.ceil(
                          (new Date(invoice.due_date) - new Date()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectInvoice(invoice)}
                    className="w-full mt-4 btn-primary"
                  >
                    View & Finance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InvestorPanel;