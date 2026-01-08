// Backend API Configuration
// Using relative URLs so requests go through proxy (Vite dev server on port 2003 or Nginx in Docker)
// This ensures all API calls go to the correct backend (port 2000) through the proxy
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';


