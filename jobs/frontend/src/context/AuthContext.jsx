import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuth } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth only once on mount/refresh
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const authData = await checkAuth();
        if (authData.authenticated) {
          setUser(authData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error loading auth:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();

    // If returning from OAuth redirect, check once more after a short delay
    // This handles the case where session cookie is set but not immediately available
    const isOAuthReturn = window.location.search.includes('code=') || 
                          sessionStorage.getItem('oauthRedirect') === 'true';
    
    if (isOAuthReturn) {
      sessionStorage.removeItem('oauthRedirect');
      // Check auth again after a short delay to ensure session is established
      setTimeout(() => {
        loadAuth();
      }, 500);
    }
  }, []); // Empty dependency array - only runs once on mount

  const updateAuth = (authData) => {
    if (authData.authenticated) {
      setUser(authData);
      setIsAuthenticated(true);
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, updateAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

