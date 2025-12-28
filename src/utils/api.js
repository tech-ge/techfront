import axios from 'axios';

// Base URL without /api
const API_BASE_URL = 'https://techback-production.up.railway.app';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 15000
});

// Smart request transformer: add /api prefix for known routes that need it
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // List of routes that require /api prefix
    const needsApiPrefix = [
      '/auth',
      '/blog',
      '/notifications',
      '/admin',
      '/users'  // /api/users
    ];

    let url = config.url || '';

    // If url starts with any that need /api, add it if missing
    const needsPrefix = needsApiPrefix.some(prefix => url.startsWith(prefix));
    if (needsPrefix && !url.startsWith('/api')) {
      config.url = '/api' + url;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
