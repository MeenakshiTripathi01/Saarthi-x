import { BACKEND_URL } from '../config';

// Check if user is authenticated using token
export const checkAuth = async () => {
  try {
    const token = localStorage.getItem('saarthixToken');
    if (!token) {
      return { authenticated: false };
    }
    
    const response = await fetch(`${BACKEND_URL}/api/user/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { authenticated: false };
    }
    
    const data = await response.json();
    // Map the response to match expected format
    return {
      authenticated: true,
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

// OAuth login removed - using token-based auth from SomethingX platform only
// Users should login through SomethingX and be redirected with token

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

