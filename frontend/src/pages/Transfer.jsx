import React, { useState, useEffect } from 'react';
import API from '../api/axios';

// Money transfer page component
const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch accounts owned by user to populate dropdown
  useEffect(() => {
    const fetchUserAccounts = async () => {
      try {
        const res = await API.get('/api/payment/accounts');
        const accountList = res.data.accounts || res.data || [];
        setAccounts(accountList);
        if (accountList.length > 0) {
          setFromAccount(accountList[0]._id);
        }
      } catch (err) {
        console.log('Error fetching user accounts:', err.message);
      }
    };
    fetchUserAccounts();
  }, []);

  // Handle money transfer submission
  const handleTransfer = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    // Generate unique idempotency key to prevent duplicate payments
    const idempotencyKey = 'IDEM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    try {
      // Send transaction payload to backend
      const res = await API.post('/api/payment/pay/transaction', {
        fromAccount,
        toAccount: toAccount.trim(),
        amount: Number(amount),
        idempotencyKey
      });

      setMessage(res.data.message || 'Transfer processed successfully');
      setAmount('');
      setToAccount('');
    } catch (err) {
      // Handle transfer processing errors
      setError(err.response?.data?.message || 'Transfer failed. Please check balance and account details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Send Money</h1>
        <p className="text-sm text-slate-400 mb-6">Transfer funds securely between bank accounts</p>

        {/* Display success message alert */}
        {message && (
          <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-3 rounded mb-6 text-sm">
            {message}
          </div>
        )}

        {/* Display error message alert */}
        {error && (
          <div className="bg-red-950 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleTransfer} className="space-y-6">
          {/* Select sender account dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Select Sender Account</label>
            <select
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.currency} Account - ID: {acc._id}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient account ID or email input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Account ID or Email</label>
            <input
              type="text"
              required
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
              placeholder="Enter recipient Account ID or Email"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>

          {/* Amount input field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Transfer Amount</label>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500 text-sm font-mono"
            />
          </div>

          {/* Submit transaction button */}
          <button
            type="submit"
            disabled={loading || accounts.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing Transfer...' : 'Initiate Transfer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Transfer;
