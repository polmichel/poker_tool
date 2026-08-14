/**
 * Shared HTTP client (axios instance with auth token interceptor).
 *
 * All API classes depend on this, so the token handling lives in exactly one
 * place. Previously every hook called `api.get/post` directly with its own
 * error handling; the API layer centralizes that.
 */
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT token to every request if present in localStorage.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('poker_tool_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 responses, clear the token so the user is redirected to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('poker_tool_token');
    }
    return Promise.reject(error);
  },
);

export { API_BASE_URL };
