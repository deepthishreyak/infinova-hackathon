/**
 * Analytics Component
 * Displays platform statistics, ROI tracking, and transaction logs
 */

import React, { useState, useEffect } from 'react';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Load analytics
      const analyticsResponse = await fetch(
        'http://localhost:3001/api/analytics'
      );
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);

      // Load transactions
      const transactionsResponse = await fetch(
        'http://localhost:3001/api/transactions?limit=20'
      );
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-2">
          📊 Platform Analytics
        </h2>
        <p className="text-gray-400">Monitor platform performance and ROI</p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border border-blue-500 border-t-transparent mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      ) : !analytics ? (
        <div className="p-8 text-center bg-gray-800/30 border border-gray-700 rounded-lg text-gray-400">
          Failed to load analytics
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Invoices */}
            <div className="glass p-6 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Total Invoices</p>
              <h3 className="text-3xl font-bold text-white mb-2">
                {analytics.invoices.total}
              </h3>
              <div className="space-y-1 text-xs text-gray-400">
                <p>Pending: {analytics.invoices.pending}</p>
                <p>Financed: {analytics.invoices.financed}</p>
                <p>Settled: {analytics.invoices.settled}</p>
              </div>
            </div>

            {/* Total Volume */}
            <div className="glass p-6 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Total Volume</p>
              <h3 className="text-3xl font-bold gradient-text mb-2">
                {(analytics.volume.total / 1_000_000).toFixed(2)} ALGO
              </h3>
              <div className="space-y-1 text-xs text-gray-400">
                <p>
                  Financed:{' '}
                  {(analytics.volume.financed / 1_000_000).toFixed(2)} ALGO
                </p>
              </div>
            </div>

            {/* Liquidity Pool */}
            <div className="glass p-6 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Liquidity Pool</p>
              <h3 className="text-3xl font-bold text-green-400 mb-2">
                {(analytics.pool.total_deposited / 1_000_000).toFixed(2)} ALGO
              </h3>
              <div className="space-y-1 text-xs text-gray-400">
                <p>Investors: {analytics.pool.investor_count}</p>
              </div>
            </div>

            {/* Average ROI */}
            <div className="glass p-6 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Avg Interest Rate</p>
              <h3 className="text-3xl font-bold text-blue-400 mb-2">
                {(analytics.roi.average_interest_rate * 100).toFixed(2)}%
              </h3>
              <div className="space-y-1 text-xs text-gray-400">
                <p>Annual yield potential</p>
              </div>
            </div>
          </div>

          {/* Invoice Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="glass p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">
                Invoice Status Distribution
              </h3>

              <div className="space-y-4">
                {[
                  {
                    label: 'Pending',
                    value: analytics.invoices.pending,
                    color: 'bg-yellow-500',
                  },
                  {
                    label: 'Financed',
                    value: analytics.invoices.financed,
                    color: 'bg-blue-500',
                  },
                  {
                    label: 'Settled',
                    value: analytics.invoices.settled,
                    color: 'bg-green-500',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="font-bold text-white">
                        {item.value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all`}
                        style={{
                          width: `${
                            analytics.invoices.total > 0
                              ? (item.value / analytics.invoices.total) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume Distribution */}
            <div className="glass p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">
                Volume Distribution
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Available</span>
                    <span className="font-bold text-white">
                      {(
                        (analytics.volume.total - analytics.volume.financed) /
                        1_000_000
                      ).toFixed(2)}{' '}
                      ALGO
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          analytics.volume.total > 0
                            ? (
                              (analytics.volume.total -
                                analytics.volume.financed) /
                              analytics.volume.total
                            ) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Financed</span>
                    <span className="font-bold text-white">
                      {(analytics.volume.financed / 1_000_000).toFixed(2)} ALGO
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          analytics.volume.total > 0
                            ? (analytics.volume.financed /
                              analytics.volume.total) *
                            100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">
              Recent Transactions
            </h3>

            {transactions.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400">
                        Details
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="badge badge-info">
                            {txn.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white">
                          {txn.type === 'INVOICE_CREATED'
                            ? `Invoice: ${txn.data.id.substring(0, 20)}...`
                            : txn.type === 'INVOICE_FINANCED'
                            ? `Amount: ${(
                              txn.data.amount / 1_000_000
                            ).toFixed(3)} ALGO`
                            : txn.type === 'RISK_SCORE'
                            ? `Risk Score: ${txn.data.risk_level}`
                            : JSON.stringify(txn.data).substring(0, 50)}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-xs">
                          {new Date(txn.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Performance Metrics */}
          <div className="glass p-6 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">
              Performance Metrics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">Financed Ratio</p>
                <p className="text-3xl font-bold gradient-text">
                  {analytics.invoices.total > 0
                    ? (
                      (analytics.invoices.financed /
                        analytics.invoices.total) *
                      100
                    ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Settlement Rate</p>
                <p className="text-3xl font-bold text-green-400">
                  {analytics.invoices.financed > 0
                    ? (
                      (analytics.invoices.settled /
                        analytics.invoices.financed) *
                      100
                    ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">
                  Average Invoice Amount
                </p>
                <p className="text-3xl font-bold text-blue-400">
                  {analytics.invoices.total > 0
                    ? (
                      analytics.volume.total /
                      analytics.invoices.total /
                      1_000_000
                    ).toFixed(2)
                    : 0}{' '}
                  ALGO
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;