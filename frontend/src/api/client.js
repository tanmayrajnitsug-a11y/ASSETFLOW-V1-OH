import axios from 'axios';

// ──────────────────────────────────────────────────────────────────
// Axios instance — reads VITE_API_BASE_URL from .env
// Fallback: http://localhost:8000/api
// ──────────────────────────────────────────────────────────────────
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach JWT ──────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — global error handling ─────────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear session and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('assetflow_token');
      localStorage.removeItem('assetflow_user');
      window.location.href = '/login';
    }
    // Normalise error message for consumers
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';
    error.displayMessage = message;
    return Promise.reject(error);
  }
);

export default client;
