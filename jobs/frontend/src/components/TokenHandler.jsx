import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config';

export default function TokenHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const userType = searchParams.get('userType');
    const picture = searchParams.get('picture');

    // If token exists in query params, validate it
    if (token) {
      const validateToken = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/validate-saarthix-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              token,
              email,
              name,
              userType,
              picture
            })
          });

          if (response.ok) {
            const data = await response.json();
            
            // Store token in localStorage for cross-platform API calls
            if (data.token) {
              localStorage.setItem('saarthixToken', data.token);
              console.log('[TokenHandler] Stored Saarthix token in localStorage');
            } else if (token) {
              // If backend didn't return token but we have it, store it anyway
              localStorage.setItem('saarthixToken', token);
              console.log('[TokenHandler] Stored token from URL params in localStorage');
            }

            // Update auth context with user info
            if (data.user) {
              updateAuth({
                authenticated: true,
                email: data.user.email,
                name: data.user.name,
                userType: data.user.userType,
                picture: data.user.picture
              });
            }

            // Remove token from URL
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('token');
            newSearchParams.delete('email');
            newSearchParams.delete('name');
            newSearchParams.delete('userType');
            newSearchParams.delete('picture');
            
            const newUrl = window.location.pathname + 
              (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
            window.history.replaceState({}, '', newUrl);
          } else {
            console.error('Token validation failed');
            // Remove token from URL even if validation fails
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('token');
            newSearchParams.delete('email');
            newSearchParams.delete('name');
            newSearchParams.delete('userType');
            newSearchParams.delete('picture');
            const newUrl = window.location.pathname + 
              (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
            window.history.replaceState({}, '', newUrl);
          }
        } catch (error) {
          console.error('Error validating token:', error);
          // Remove token from URL on error
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('token');
          newSearchParams.delete('email');
          newSearchParams.delete('name');
          newSearchParams.delete('userType');
          newSearchParams.delete('picture');
          const newUrl = window.location.pathname + 
            (newSearchParams.toString() ? '?' + newSearchParams.toString() : '');
          window.history.replaceState({}, '', newUrl);
        }
      };

      validateToken();
    }
  }, [searchParams, updateAuth]);

  return null; // This component doesn't render anything
}

