import React, { useState, useEffect } from 'react';
import API from '../api/axios';

// Bank statements and audit trail page component
const Statement = () => {
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);

  // Fetch statement ledger entries based on selected timeframe filter
  const fetchStatement = async (filterTimeframe) => {
    try {
      setLoading(true);
      const res = await API.get(`/api/payment/pay/statement?timeframe=${filterTimeframe}`);
      const data = res.data.statement || res.data || [];
      setLedgerEntries(data);
    } catch (err) {
      console.log('Error fetching bank statement:', err.message);
      setLedgerEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement(timeframe);
  }, [timeframe]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header section matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Bank Statements & Audit Trail</h1>
          <p className="text-sm text-slate-400">View double-entry ledger history populated with Mongo Account IDs & Usernames</p>
        </div>

        {/* Filter button tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setTimeframe('day')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeframe === 'day' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeframe === 'week' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeframe === 'month' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              timeframe === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Main content area */}
      {loading ? (
        <div className="text-center text-slate-400 py-16 bg-slate-900 border border-slate-800 rounded-lg">
          Loading audit trail statement...
        </div>
      ) : ledgerEntries.length === 0 ? (
        /* Empty ledger state box matching screenshot */
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Ledger Entries Found</h3>
          <p className="text-sm text-slate-400">There are no transactions recorded for the selected filter.</p>
        </div>
      ) : (
        /* Ledger entries table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Account ID</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ledgerEntries.map((entry) => (
                <tr key={entry._id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-1 text-xs font-bold rounded border ${
                        entry.type === 'DEBIT'
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">
                    {entry.account?._id || entry.account}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-white">
                    {entry.type === 'DEBIT' ? '-' : '+'}
                    {entry.amount}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {entry.transaction?._id || entry.transaction || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Statement;
