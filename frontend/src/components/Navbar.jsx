import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Navigation bar component for logged-in users
const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to check active navigation link
  const isActive = (path) => location.pathname === path;

  // Handle logout button click
  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      {/* Brand logo title */}
      <div className="flex items-center space-x-3">
        <Link to="/accounts" className="text-xl font-bold tracking-wide text-blue-400">
          PaymentDummy <span className="text-xs text-slate-400 font-normal">LEDGER ENGINE</span>
        </Link>
      </div>

      {/* Primary navigation menu links */}
      <div className="flex items-center space-x-4">
        <Link
          to="/accounts"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/accounts') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          My Accounts
        </Link>
        <Link
          to="/transfer"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/transfer') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Send Money
        </Link>
        <Link
          to="/statement"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive('/statement') ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          Bank Statement
        </Link>
      </div>

      {/* User info profile badge and logout button */}
      <div className="flex items-center space-x-4">
        {user?.email && (
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user.name || 'User'}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
