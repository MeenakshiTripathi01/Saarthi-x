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
        // First check if we have a Saarthix token (from SomethingX platform)
        const saarthixToken = localStorage.getItem('saarthixToken');
        if (saarthixToken) {
          // If we have a token, check if we have user info stored
          const storedUser = localStorage.getItem('saarthixUser');
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              setUser(userData);
              setIsAuthenticated(true);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Error parsing stored user:', e);
            }
          }
        }

        // Otherwise, check token-based auth
        const authData = await checkAuth();
        if (authData.authenticated) {
          setUser(authData);
          setIsAuthenticated(true);
          console.log('User authenticated with role:', authData.userType);
          // Store user data
          localStorage.setItem('saarthixUser', JSON.stringify(authData));
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

    // OAuth redirect handling removed - using token-based auth only
  }, []); // Empty dependency array - only runs once on mount

  const updateAuth = (authData) => {
    if (authData && (authData.authenticated || authData.email)) {
      const userData = {
        ...authData,
        authenticated: true,
        userType: authData.userType || 'APPLICANT', // Default to APPLICANT if not specified
      };
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store user data in localStorage for token-based auth
      localStorage.setItem('saarthixUser', JSON.stringify(userData));
    } else {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('saarthixUser');
    }
  };

  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('saarthixToken');
    localStorage.removeItem('saarthixUser');
  };

  // Helper to check if user is INDUSTRY type
  const isIndustry = user?.userType === 'INDUSTRY';
  
  // Helper to check if user is APPLICANT type
  const isApplicant = user?.userType === 'APPLICANT';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, updateAuth, clearAuth, isIndustry, isApplicant }}>
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

