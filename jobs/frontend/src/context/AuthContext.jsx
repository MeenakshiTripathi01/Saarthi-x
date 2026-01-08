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
          console.log('User authenticated with role:', authData.userType);
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
      // This is crucial for EXISTING users to get their role from database
      setTimeout(() => {
        loadAuth();
      }, 1000); // Increased to 1000ms to ensure backend is ready
    }
  }, []); // Empty dependency array - only runs once on mount

  const updateAuth = (authData) => {
    if (authData.authenticated) {
      setUser({
        ...authData,
        userType: authData.userType || 'APPLICANT', // Default to APPLICANT if not specified
      });
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

