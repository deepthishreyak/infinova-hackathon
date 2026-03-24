/**
 * Supplier Panel Component
 * Allows suppliers to create, tokenize, and manage invoices
 */

import React, { useState, useEffect } from 'react';

function SupplierPanel({ userAddress }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    buyer_address: '',
    amount: '',
    due_date: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userAddress) {
      loadInvoices();
    }
  }, [userAddress]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/invoices');
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.buyer_address || !formData.amount || !formData.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.buyer_address.startsWith('A') || formData.buyer_address.length !== 58) {
      setError('Invalid Algorand address format');
      return;
    }

    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setError('Invalid amount');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier_address: userAddress,
          buyer_address: formData.buyer_address,
          amount: parseInt(parseFloat(formData.amount) * 1_000_000), // Convert to microAlgos
          due_date: formData.due_date,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const data = await response.json();
      setSuccess(`Invoice created: ${data.invoice_id}`);
      setFormData({ buyer_address: '', amount: '', due_date: '', description: '' });
      setShowForm(false);

      // Reload invoices
      setTimeout(() => loadInvoices(), 1000);
    } catch (err) {
      setError(err.message || 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFinanceRequest = async (invoiceId) => {
    // In production, this would initiate the financing request flow
    setSuccess(`Financing request sent for invoice ${invoiceId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">📄 Supplier Dashboard</h2>
        <p className="text-gray-400">Create and manage your invoices</p>
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

      {/* Create Invoice Form */}
      {showForm && (
        <div className="glass p-6 rounded-lg space-y-4 animate-slide-in">
          <h3 className="text-xl font-bold text-white mb-4">Create New Invoice</h3>

          <form onSubmit={handleCreateInvoice} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buyer Address (Algorand)
              </label>
              <input
                type="text"
                name="buyer_address"
                placeholder="A..."
                value={formData.buyer_address}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invoice Amount (ALGO)
              </label>
              <input
                type="number"
                name="amount"
                placeholder="100.5"
                step="0.001"
                value={formData.amount}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Enter invoice details (optional)"
                value={formData.description}
                onChange={handleInputChange}
                className="input min-h-24"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Invoice Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-lg transition-all"
        >
          + Create New Invoice
        </button>
      )}

      {/* Invoices List */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Your Invoices</h3>
        {loading && invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border border-blue-500 border-t-transparent mb-4"></div>
            <p>Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center bg-gray-800/30 border border-gray-700 rounded-lg text-gray-400">
            No invoices yet. Create one to get started!
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="glass p-6 rounded-lg space-y-4 animate-fade-in"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{invoice.id}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Amount</p>
                        <p className="text-blue-400 font-semibold">
                          {(invoice.amount / 1_000_000).toFixed(3)} ALGO
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Buyer</p>
                        <p className="text-gray-300 font-mono text-xs">
                          {invoice.buyer_address.slice(0, 10)}...
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Due Date</p>
                        <p className="text-gray-300">
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Status</p>
                        <span
                          className={`badge ${
                            invoice.status === 'pending'
                              ? 'badge-warning'
                              : invoice.status === 'financed'
                              ? 'badge-info'
                              : 'badge-success'
                          }`}
                        >
                          {invoice.status.charAt(0).toUpperCase() +
                            invoice.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {invoice.status === 'pending' && (
                    <button
                      onClick={() => handleFinanceRequest(invoice.id)}
                      className="btn-primary"
                    >
                      Request Finance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierPanel;