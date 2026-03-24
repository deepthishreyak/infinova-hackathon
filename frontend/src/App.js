/**
 * Production-Ready Invoice Financing dApp Frontend
 * React + Tailwind CSS with modern fintech UI/UX design
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import SupplierPanel from './components/SupplierPanel';
import InvestorPanel from './components/InvestorPanel';
import Analytics from './components/Analytics';
import WalletConnect from './components/WalletConnect';
import { auth, signInWithGoogle, signOutUser } from './firebase';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('supplier');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(true);

  useEffect(() => {
    // Check if wallet is already connected
    const checkWallet = async () => {
      try {
        const connected = localStorage.getItem('walletConnected');
        const address = localStorage.getItem('userAddress');
        if (connected && address) {
          setWalletConnected(true);
          setUserAddress(address);
          setShowWalletInfo(false);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    };

    checkWallet();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleWalletConnect = (address) => {
    setUserAddress(address);
    setWalletConnected(true);
    setShowWalletInfo(false);
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('userAddress', address);
  };

  const handleWalletDisconnect = () => {
    setWalletConnected(false);
    setUserAddress('');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('userAddress');
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Firebase login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      handleWalletDisconnect();
    } catch (error) {
      console.error('Firebase logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-blue-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            {/* Logo */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-lg">
                ⚡
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">InvoiceFlow</h1>
                <p className="text-xs text-gray-400">Algorand DeFi</p>
              </div>
            </div>

            {/* Account Status - Center */}
            <div className="flex items-center gap-3 flex-1 justify-center min-w-0">
              {!authLoading && firebaseUser && (
                <div className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg backdrop-blur-sm truncate">
                  <p className="text-sm text-blue-200 truncate">
                    👤 {firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'}
                  </p>
                </div>
              )}
            </div>

            {/* Wallet & Auth Buttons - Right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {!authLoading && !firebaseUser ? (
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-emerald-500/50"
                >
                  {loading ? '🔄' : '🔐'} Login
                </button>
              ) : null}

              {walletConnected && firebaseUser ? (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-green-300 font-mono">
                      ✓ {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={handleWalletDisconnect}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-xs text-red-300 transition-all"
                  >
                    Disconnect
                  </button>
                </div>
              ) : null}

              {firebaseUser && (
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-500/30 rounded-lg text-sm text-gray-200 transition-all"
                >
                  {loading ? '...' : 'Logout'}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          {firebaseUser && (
            <nav className="mt-6 flex space-x-1 border-b border-gray-700 overflow-x-auto">
              {[
                { id: 'supplier', label: '📄 Supplier', desc: 'Create & Tokenize' },
                { id: 'investor', label: '💰 Investor', desc: 'Fund & Earn' },
                { id: 'analytics', label: '📊 Analytics', desc: 'Dashboard' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-6 py-3 font-medium text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-400 border-b-2 border-blue-500 shadow-lg shadow-blue-500/50'
                      : 'text-gray-400 hover:text-gray-300 border-b-2 border-transparent'
                  }`}
                  title={tab.desc}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Login Required State */}
        {!firebaseUser && !authLoading && (
          <div className="py-16 text-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  Welcome to InvoiceFlow
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Tokenized Invoice Financing on Algorand Blockchain | Powered by Firebase Auth
                </p>
              </div>

              <div className="p-8 bg-gradient-to-br from-slate-800/50 to-purple-800/50 border border-blue-500/20 rounded-2xl backdrop-blur-sm max-w-md mx-auto shadow-xl">
                <h3 className="text-2xl font-bold text-blue-300 mb-6">🔐 Sign In to Continue</h3>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/50 text-lg"
                >
                  {loading ? '🔄 Connecting...' : '✓ Login with Google'}
                </button>
                <p className="text-sm text-gray-400 mt-4">Secure authentication with Firebase</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <div className="text-3xl mb-2">🏦</div>
                  <h4 className="font-semibold text-blue-300">For Suppliers</h4>
                  <p className="text-sm text-gray-400">Tokenize invoices as ASAs</p>
                </div>
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                  <div className="text-3xl mb-2">💎</div>
                  <h4 className="font-semibold text-purple-300">For Investors</h4>
                  <p className="text-sm text-gray-400">Fund & earn interest</p>
                </div>
                <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                  <div className="text-3xl mb-2">⚡</div>
                  <h4 className="font-semibold text-cyan-300">On Algorand</h4>
                  <p className="text-sm text-gray-400">Fast & secure transactions</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Connection Required */}
        {firebaseUser && !walletConnected && showWalletInfo && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-amber-300 mb-3 flex items-center gap-2">
              <span>⛓️</span> Connect Your Algorand Wallet
            </h2>
            <p className="text-gray-300 mb-4">
              To start trading invoices, connect your Algorand wallet (Pera or AlgoSigner).
            </p>
            {!walletConnected && <WalletConnect onConnect={handleWalletConnect} />}
          </div>
        )}

        {/* Ready State */}
        {firebaseUser && walletConnected && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg backdrop-blur-sm flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-300">Ready to trade!</p>
              <p className="text-sm text-gray-400">Connected to Algorand wallet with Firebase authentication</p>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          {firebaseUser && activeTab === 'supplier' && <SupplierPanel userAddress={userAddress} />}
          {firebaseUser && activeTab === 'investor' && <InvestorPanel userAddress={userAddress} />}
          {firebaseUser && activeTab === 'analytics' && <Analytics />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-slate-900/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">InvoiceFlow</h3>
              <p className="text-sm text-gray-400">
                Tokenized invoice financing on Algorand blockchain.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">Documentation</button></li>
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">API Reference</button></li>
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">Smart Contracts</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">Help Center</button></li>
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">Report Issue</button></li>
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">Feedback</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">Discord</button></li>
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">GitHub</button></li>
                <li><button onClick={() => window.open('#')} className="hover:text-blue-400">Twitter</button></li>
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
