import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Login page component
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Send login request to backend API
      const res = await API.post('/api/payment/user/login', {
        email: email.trim(),
        password: password
      });

      // Save user details in auth context
      loginUser(res.data.user || { email, loggedIn: true });

      // Redirect user to accounts dashboard upon successful login
      navigate('/accounts');
    } catch (err) {
      // Set error message if login credentials fail
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p className="text-sm text-center text-slate-400 mb-6">Sign in to your Payment Gateway Ledger account</p>

        {/* Display error alert message if login fails */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Password input field */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Register redirect link */}
        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
