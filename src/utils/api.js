import axios from 'axios';

// FIXED: Use the correct backend URL
const API_BASE_URL = 'https://techback-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 10000 // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized, logging out...');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - check backend connection');
    }
    
    return Promise.reject(error);
  }
);

export default api;
