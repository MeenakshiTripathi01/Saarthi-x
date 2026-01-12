import axios from 'axios';
import { BACKEND_URL } from '../config';

// Create axios instance
// Use empty baseURL in production (relative URLs work with nginx proxy)
// Only set baseURL if it's explicitly provided (for development)
const axiosInstance = axios.create({
  baseURL: BACKEND_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Saarthix token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const saarthixToken = localStorage.getItem('saarthixToken');
    const fullUrl = (config.baseURL || '') + (config.url || '');
    
    // Always set Authorization header if token exists
    if (saarthixToken) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${saarthixToken}`;
      console.log('[Axios] Added Saarthix token to request:', config.url || fullUrl);
      console.log('[Axios] Token preview:', saarthixToken.substring(0, 20) + '...');
      console.log('[Axios] Authorization header set:', config.headers.Authorization ? 'YES' : 'NO');
    } else {
      console.warn('[Axios] No Saarthix token found in localStorage for request:', config.url || fullUrl);
      console.log('[Axios] Available localStorage keys:', Object.keys(localStorage));
    }
    return config;
  },
  (error) => {
    console.error('[Axios] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default axiosInstance;

