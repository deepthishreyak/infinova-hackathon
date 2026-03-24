/**
 * Production-Ready Invoice Financing dApp Frontend
 * React + Tailwind CSS dark futuristic dashboard
 */

import React, { useState, useEffect } from 'react';
import SupplierPanel from './components/SupplierPanel';
import InvestorPanel from './components/InvestorPanel';
import Analytics from './components/Analytics';
import WalletConnect from './components/WalletConnect';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('supplier');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    const checkWallet = async () => {
      try {
        const connected = localStorage.getItem('walletConnected');
        const address = localStorage.getItem('userAddress');
        if (connected && address) {
          setWalletConnected(true);
          setUserAddress(address);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    };

    checkWallet();
  }, []);

  const handleWalletConnect = (address) => {
    setUserAddress(address);
    setWalletConnected(true);
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('userAddress', address);
  };

  const handleWalletDisconnect = () => {
    setWalletConnected(false);
    setUserAddress('');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('userAddress');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white">
                IF
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">InvoiceFlow</h1>
                <p className="text-xs text-gray-400">Algorand Invoice Financing</p>
              </div>
            </div>

            {/* Wallet Connection Status */}
            <div className="flex items-center space-x-4">
              {walletConnected ? (
                <div className="flex items-center space-x-3">
                  <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400 font-mono">
                      {userAddress.slice(0, 8)}...{userAddress.slice(-8)}
                    </p>
                  </div>
                  <button
                    onClick={handleWalletDisconnect}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <WalletConnect onConnect={handleWalletConnect} />
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-6 flex space-x-1 border-b border-gray-700">
            {[
              { id: 'supplier', label: '📄 Supplier', icon: '📄' },
              { id: 'investor', label: '💰 Investor', icon: '💰' },
              { id: 'analytics', label: '📊 Analytics', icon: '📊' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!walletConnected && (
          <div className="mb-8 p-6 bg-blue-500/5 border border-blue-500/30 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-300 mb-2">
              🔗 Connect Your Wallet
            </h2>
            <p className="text-gray-300">
              Please connect your Algorand wallet to access the application.
            </p>
          </div>
        )}

        {/* Tab Content */}
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
          {activeTab === 'supplier' && <SupplierPanel userAddress={userAddress} />}
          {activeTab === 'investor' && <InvestorPanel userAddress={userAddress} />}
          {activeTab === 'analytics' && <Analytics />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">About</h3>
              <p className="text-sm text-gray-400">
                InvoiceFlow: Tokenized invoice financing on Algorand blockchain.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-blue-400">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400">API Reference</a></li>
                <li><a href="#" className="hover:text-blue-400">Smart Contracts</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-blue-400">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400">Report Issue</a></li>
                <li><a href="#" className="hover:text-blue-400">Feedback</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-blue-400">Discord</a></li>
                <li><a href="#" className="hover:text-blue-400">GitHub</a></li>
                <li><a href="#" className="hover:text-blue-400">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2026 InvoiceFlow. Built on Algorand. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;