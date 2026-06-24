import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const getBaseUrl = (): string => {
  let url = API_BASE_URL;
  if (!url) {
    return '/api';
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject the authorization token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('stayease_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected API error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    
    // Auto logout if unauthenticated on auth protected routes (excluding login and register)
    if (error.response?.status === 401) {
      const isAuthRoute = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
      if (!isAuthRoute) {
        localStorage.removeItem('stayease_token');
        localStorage.removeItem('stayease_user');
        // We can dispatch a storage event or window event if components need to reload
        window.dispatchEvent(new Event('storage'));
      }
    }

    console.error('[API Client Error]', customError);
    return Promise.reject(customError);
  }
);

export default api;
