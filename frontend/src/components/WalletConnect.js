/**
 * Wallet Connection Component
 * Handles connection to Algorand wallets (Pera, AlgoSigner)
 */

import React, { useState } from 'react';

function WalletConnect({ onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async (walletType) => {
    setLoading(true);
    setError('');

    try {
      if (walletType === 'pera') {
        // Pera Wallet connection
        if (typeof window !== 'undefined' && window.peraWallet) {
          const accounts = await window.peraWallet.connect();
          if (accounts && accounts.length > 0) {
            onConnect(accounts[0]);
          }
        } else {
          // Redirect to Pera Wallet
          window.open('https://perawallet.app', '_blank');
          setError('Please install Pera Wallet and try again');
        }
      } else if (walletType === 'algosigner') {
        // AlgoSigner connection
        if (typeof window !== 'undefined' && window.AlgoSigner) {
          await window.AlgoSigner.connect();
          const accounts = await window.AlgoSigner.accounts({
            ledger: 'TestNet',
          });
          if (accounts && accounts.length > 0) {
            onConnect(accounts[0].address);
          }
        } else {
          setError('AlgoSigner not detected. Please install the extension.');
        }
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => connectWallet('pera')}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
        >
          {loading ? 'Connecting...' : 'Pera Wallet'}
        </button>

        <button
          onClick={() => connectWallet('algosigner')}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
        >
          {loading ? 'Connecting...' : 'AlgoSigner'}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Don't have a wallet? <a href="https://perawallet.app" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Download Pera</a>
      </p>
    </div>
  );
}

export default WalletConnect;
