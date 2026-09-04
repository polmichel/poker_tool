/**
 * Shared HTTP client (axios instance with auth token interceptor).
 *
 * All API classes depend on this, so the token handling lives in exactly one
 * place. Previously every hook called `api.get/post` directly with its own
 * error handling; the API layer centralizes that.
 *
 * Enhanced with standardized error handling and response validation.
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Custom error type for our API
export interface ApiErrorExtended extends Error {
  status?: number;
  data?: unknown;
  isApiError: boolean;
}

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the JWT token to every request if present in localStorage.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('poker_tool_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Enhanced response interceptor with standardized error handling
api.interceptors.response.use(
  (response) => {
    // For successful responses, just return the response
    return response;
  },
  (error: AxiosError) => {
    // Create a standardized error object
    const errorMessage = error.response?.data?.message ||
      error.response?.statusText ||
      error.message ||
      'An unknown error occurred';
    
    const apiError: ApiErrorExtended = new Error(errorMessage) as ApiErrorExtended;
    
    apiError.name = 'ApiError';
    apiError.isApiError = true;
    apiError.status = error.response?.status;
    apiError.data = error.response?.data as unknown;

    // On 401 responses, clear the token so the user is redirected to login.
    if (error.response?.status === 401) {
      localStorage.removeItem('poker_tool_token');
    }

    // Reject with our standardized error
    return Promise.reject(apiError);
  },
);

/**
 * Helper to extract error message from any error
 */
export function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    if ('isApiError' in error && (error as ApiErrorExtended).isApiError) {
      const apiErr = error as ApiErrorExtended;
      return apiErr.message || fallbackMessage;
    }
    return error.message || fallbackMessage;
  }
  
  if (typeof error === 'string') {
    return error || fallbackMessage;
  }
  
  return fallbackMessage;
}

/**
 * Helper to check if an error is an API error (4xx or 5xx)
 */
export function isApiError(error: unknown): boolean {
  if (
    error instanceof Error &&
    'isApiError' in error &&
    (error as ApiErrorExtended).isApiError === true
  ) {
    return true;
  }
  // Also check for AxiosError
  const axiosError = error as { isAxiosError?: boolean };
  return axiosError.isAxiosError === true;
}

/**
 * Helper to check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const err = error as { code?: string };
  return (
    error instanceof Error &&
    'code' in error &&
    (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK')
  );
}

/**
 * Helper to check if an error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  const err = error as { code?: string };
  return (
    error instanceof Error &&
    'code' in error &&
    err.code === 'ECONNABORTED'
  );
}

/**
 * Helper to check if an error is a 404 Not Found
 */
export function isNotFoundError(error: unknown): boolean {
  return isApiError(error) && error.status === 404;
}

/**
 * Helper to check if an error is a 401 Unauthorized
 */
export function isUnauthorizedError(error: unknown): boolean {
  return isApiError(error) && error.status === 401;
}

/**
 * Helper to check if an error is a 400 Bad Request (validation error)
 */
export function isValidationError(error: unknown): boolean {
  return isApiError(error) && error.status === 400;
}

export { API_BASE_URL };
export type { AxiosError };
