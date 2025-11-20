const BACKEND_URL = 'http://localhost:8080';

// Check if user is authenticated
export const checkAuth = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/me`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { authenticated: false };
    }
    
    const data = await response.json();
    // Map the response to match expected format
    return {
      authenticated: data.authenticated || true,
      name: data.name,
      email: data.email,
      picture: data.picture,
      userType: data.userType
    };
  } catch (error) {
    console.error('Error checking auth:', error);
    return { authenticated: false };
  }
};

// Initiate Google login
export const loginWithGoogle = () => {
  // Mark that we're redirecting for OAuth
  sessionStorage.setItem('oauthRedirect', 'true');
  window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
};

// Logout
export const logout = async (clearAuthCallback) => {
  try {
    await fetch(`${BACKEND_URL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    // Clear session storage
    sessionStorage.removeItem('oauthRedirect');
    // Clear auth state if callback provided
    if (clearAuthCallback) {
      clearAuthCallback();
    }
    // Reload page to ensure clean state
    window.location.href = '/';
  } catch (error) {
    console.error('Error logging out:', error);
    // Still clear local state even if backend call fails
    sessionStorage.removeItem('oauthRedirect');
    if (clearAuthCallback) {
      clearAuthCallback();
    }
    window.location.href = '/';
  }
};

