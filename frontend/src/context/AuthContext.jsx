import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

// Create authentication context
const AuthContext = createContext();

// AuthProvider component to manage user state across the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on initial page load
  const checkAuth = async () => {
    try {
      // Attempt to fetch user accounts to verify active session cookie
      const res = await API.get('/api/payment/accounts');
      if (res.data) {
        // Retrieve stored user details from localStorage if available
        const storedUser = localStorage.getItem('user_details');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser({ loggedIn: true });
        }
      }
    } catch (error) {
      // Clear user state if authentication fails or cookie is invalid
      setUser(null);
      localStorage.removeItem('user_details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Login handler function
  const loginUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user_details', JSON.stringify(userData));
  };

  // Logout handler function
  const logoutUser = async () => {
    try {
      await API.post('/api/payment/user/logout');
    } catch (err) {
      console.log('Logout error:', err.message);
    } finally {
      setUser(null);
      localStorage.removeItem('user_details');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to consume authentication context easily
export const useAuth = () => useContext(AuthContext);
