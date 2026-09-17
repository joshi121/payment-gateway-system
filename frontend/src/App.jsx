import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Accounts from './pages/Accounts';
import Transfer from './pages/Transfer';
import Statement from './pages/Statement';

// Protected route wrapper component for authenticated users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Loading application...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

// Public route wrapper component for unauthenticated users
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Loading application...</div>;
  }
  if (user) {
    return <Navigate to="/accounts" replace />;
  }
  return children;
};

// Main App routing component
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public authentication routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected banking dashboard routes */}
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfer"
            element={
              <ProtectedRoute>
                <Transfer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statement"
            element={
              <ProtectedRoute>
                <Statement />
              </ProtectedRoute>
            }
          />

          {/* Fallback route redirect */}
          <Route path="*" element={<Navigate to="/accounts" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
