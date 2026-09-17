import React, { useState, useEffect } from 'react';
import API from '../api/axios';

// Accounts dashboard component
const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch all accounts owned by the logged-in user
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await API.get('/api/payment/accounts');
      const accountList = res.data.accounts || res.data || [];
      setAccounts(accountList);

      // Fetch balance for each retrieved account
      accountList.forEach(async (acc) => {
        try {
          const balRes = await API.get(`/api/payment/accounts/balance/${acc._id}`);
          setBalances((prev) => ({
            ...prev,
            [acc._id]: balRes.data.balance !== undefined ? balRes.data.balance : 0
          }));
        } catch (err) {
          console.log('Balance fetch error:', err.message);
        }
      });
    } catch (err) {
      console.log('Account fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Create new account handler function
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage('');

    try {
      // Send request to register new account with selected currency
      await API.post('/api/payment/accounts', { currency });
      setMessage('Account created successfully');
      fetchAccounts();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Accounts</h1>
          <p className="text-sm text-slate-400">Manage your active banking accounts and balances</p>
        </div>

        {/* Create account form */}
        <form onSubmit={handleCreateAccount} className="flex items-center space-x-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-md text-sm"
          >
            <option value="INR">INR (Indian Rupee)</option>
            <option value="USD">USD (US Dollar)</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* Alert message display */}
      {message && (
        <div className="bg-slate-800 border border-blue-500 text-blue-200 px-4 py-3 rounded mb-6 text-sm">
          {message}
        </div>
      )}

      {/* Loading state indicator */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        /* Empty accounts placeholder */
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center text-slate-400">
          <p className="text-lg font-medium text-white mb-2">No Active Accounts Found</p>
          <p className="text-sm mb-4">Create your first account using the form above to get started.</p>
        </div>
      ) : (
        /* Accounts list grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => (
            <div key={acc._id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800">
                    {acc.currency || 'INR'} ACCOUNT
                  </span>
                  <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {acc.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mb-1">Account ID</p>
                <p className="text-sm font-mono text-slate-200 bg-slate-900 p-2 rounded border border-slate-800 select-all mb-4 break-all">
                  {acc._id}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-white">
                  {acc.currency === 'USD' ? '$' : '₹'}
                  {balances[acc._id] !== undefined ? balances[acc._id] : '0.00'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Accounts;
