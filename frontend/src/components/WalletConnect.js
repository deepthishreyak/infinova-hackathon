/**
 * Wallet Connection Component
 * Handles connection to Algorand wallets (Pera, AlgoSigner) with improved UX
 */

import React, { useState, useEffect } from 'react';

// Initialize Pera Wallet app
const initializePeraWallet = () => {
  if (typeof window !== 'undefined') {
    try {
      // Dynamically load Pera Wallet if not already available
      if (!window.peraWallet) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@perawallet/connect@2.0.0/dist/index.umd.js';
        script.async = true;
        document.head.appendChild(script);
      }
    } catch (e) {
      console.log('Pera Wallet initialization:', e);
    }
  }
};

function WalletConnect({ onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [peraAvailable, setPeraAvailable] = useState(false);

  useEffect(() => {
    initializePeraWallet();
    // Check if Pera Wallet is available
    const checkPeraWallet = () => {
      if (typeof window !== 'undefined' && window.peraWallet) {
        setPeraAvailable(true);
      }
    };

    checkPeraWallet();
    const timer = setTimeout(checkPeraWallet, 1000);
    return () => clearTimeout(timer);
  }, []);

  const connectPera = async () => {
    setLoading(true);
    setError('');

    try {
      if (typeof window === 'undefined') {
        setError('Window object not found');
        setLoading(false);
        return;
      }

      // Use @perawallet/connect if available
      if (window.PeraWalletConnect) {
        const peraWallet = new window.PeraWalletConnect();
        const accounts = await peraWallet.connect('TESTNET');
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0]);
        }
      } else if (window.peraWallet) {
        // Legacy Pera Wallet integration
        const accounts = await window.peraWallet.connect();
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0]);
        }
      } else {
        // Pera Wallet not installed
        window.open('https://perawallet.app', '_blank');
        setError('Pera Wallet not detected. Opening download page...');
      }
    } catch (err) {
      console.error('Pera Wallet connection error:', err);
      setError(err.message || 'Failed to connect Pera Wallet');
    } finally {
      setLoading(false);
    }
  };

  const connectAlgoSigner = async () => {
    setLoading(true);
    setError('');

    try {
      if (typeof window !== 'undefined' && window.AlgoSigner) {
        await window.AlgoSigner.connect();
        const accounts = await window.AlgoSigner.accounts({
          ledger: 'TestNet',
        });
        if (accounts && accounts.length > 0) {
          onConnect(accounts[0].address);
        }
      } else {
        setError('AlgoSigner extension not installed');
        window.open('https://chrome.google.com/webstore/detail/algosigner/kmmolakhbgmpmybjmhlwpkghelmgibgb', '_blank');
      }
    } catch (err) {
      console.error('AlgoSigner connection error:', err);
      setError(err.message || 'Failed to connect AlgoSigner');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-lg text-red-300 text-sm backdrop-blur-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Pera Wallet Button */}
        <button
          onClick={connectPera}
          disabled={loading}
          className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">◌</span> Connecting...
            </>
          ) : (
            <>
              💳 Pera Wallet
            </>
          )}
        </button>

        {/* AlgoSigner Button */}
        <button
          onClick={connectAlgoSigner}
          disabled={loading}
          className="w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">◌</span> Connecting...
            </>
          ) : (
            <>
              🔐 AlgoSigner
            </>
          )}
        </button>
      </div>

      {/* Info Section */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
        <p className="text-xs text-gray-300 mb-2">💡 <strong>Choose your Algorand wallet:</strong></p>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• <strong>Pera Wallet</strong>: Mobile-first, recommended for TestNet</li>
          <li>• <strong>AlgoSigner</strong>: Browser extension for desktop</li>
        </ul>
        <p className="text-xs text-gray-400 mt-3">
          Don't have a wallet? <button onClick={() => window.open('https://perawallet.app', '_blank')} className="text-blue-400 hover:text-blue-300 font-semibold">Download Pera Wallet →</button>
        </p>
      </div>

      {peraAvailable && (
        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs text-center">
          ✓ Pera Wallet detected
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
