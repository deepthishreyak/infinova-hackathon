import React, { useState, useEffect } from 'react';
import { PeraWalletConnect } from "@perawallet/connect";

const peraWallet = new PeraWalletConnect();

function WalletConnect({ onConnect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reconnect to the session when the component is mounted
    peraWallet.reconnectSession().then((accounts) => {
      peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
      if (accounts.length) {
        onConnect(accounts[0]);
      }
    });
  }, [onConnect]);

  const connectWallet = () => {
    setLoading(true);
    setError('');

    peraWallet.connect()
      .then((newAccounts) => {
        peraWallet.connector?.on("disconnect", handleDisconnectWalletClick);
        if (newAccounts.length > 0) {
          onConnect(newAccounts[0]);
        }
      })
      .catch((error) => {
        if (error?.data?.type !== "USER_REJECT") {
          console.error('Wallet connection error:', error);
          setError(error?.message || 'Failed to connect wallet');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDisconnectWalletClick = () => {
    peraWallet.disconnect();
  };

  return (
    <div className="space-y-4 text-center">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={connectWallet}
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-white font-semibold rounded-xl transition-all"
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect Pera Wallet'
          )}
        </button>
      </div>

      <p className="text-sm text-gray-400">
        Don't have a wallet?{' '}
        <a 
          href="https://perawallet.app" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline transition-all"
        >
          Download Pera
        </a>
      </p>
    </div>
  );
}

export default WalletConnect;
