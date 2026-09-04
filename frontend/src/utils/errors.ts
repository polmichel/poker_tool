/**
 * Shared error extraction and handling utilities.
 *
 * Centralizes error parsing logic for HTTP requests and API responses.
 * Provides consistent error handling across the application.
 *
 * For non-axios errors (e.g. a thrown `Error` in tests) the default message
 * is returned, matching the historical behaviour of the data hooks which
 * surfaced a stable, localized message rather than the raw exception text.
 * Pass `useMessage=true` to fall back to `err.message` instead (legacy
 * behaviour of useEquity).
 */
import axios, { AxiosError } from 'axios';
import { ApiErrorExtended, isApiError as isApiErrorFromClient } from '../api/client';

/**
 * Extract error message from any error type
 *
 * @param err - The error to extract message from
 * @param defaultMessage - The default message to use if extraction fails
 * @param useMessage - Whether to use the error's message property (for legacy behavior)
 * @returns The extracted error message
 */
export function extractErrorMessage(
  err: unknown,
  defaultMessage: string,
  useMessage = false,
): string {
  // Check if it's an API error from our client
  if (isApiErrorFromClient(err)) {
    const apiErr = err as ApiErrorExtended;
    if (apiErr.message) return apiErr.message;
  }

  // Check if it's an Axios error
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    const body = axiosErr.response?.data as { error?: string } | undefined;
    if (body?.error) return body.error;
    if (axiosErr.response?.statusText) return axiosErr.response.statusText;
    if (axiosErr.message) return axiosErr.message;
  }

  // Check if it's a generic Error with message
  if (useMessage && err instanceof Error && err.message) return err.message;

  // Return default message
  return defaultMessage;
}

/**
 * Check if an error is an API error (from our client or axios)
 */
export function isApiError(err: unknown): boolean {
  return isApiErrorFromClient(err) || axios.isAxiosError(err);
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    return !axiosErr.response; // No response means network error
  }
  return false;
}

/**
 * Check if an error is a timeout error
 */
export function isTimeoutError(err: unknown): boolean {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    return axiosErr.code === 'ECONNABORTED';
  }
  return false;
}

/**
 * Check if an error is a 404 Not Found
 */
export function isNotFoundError(err: unknown): boolean {
  if (isApiErrorFromClient(err)) {
    return (err as ApiErrorExtended).status === 404;
  }
  if (axios.isAxiosError(err)) {
    return err.response?.status === 404;
  }
  return false;
}

/**
 * Check if an error is a 401 Unauthorized
 */
export function isUnauthorizedError(err: unknown): boolean {
  if (isApiErrorFromClient(err)) {
    return (err as ApiErrorExtended).status === 401;
  }
  if (axios.isAxiosError(err)) {
    return err.response?.status === 401;
  }
  return false;
}

/**
 * Check if an error is a 400 Bad Request (validation error)
 */
export function isValidationError(err: unknown): boolean {
  if (isApiErrorFromClient(err)) {
    return (err as ApiErrorExtended).status === 400;
  }
  if (axios.isAxiosError(err)) {
    return err.response?.status === 400;
  }
  return false;
}

/**
 * Check if an error is a 403 Forbidden
 */
export function isForbiddenError(err: unknown): boolean {
  if (isApiErrorFromClient(err)) {
    return (err as ApiErrorExtended).status === 403;
  }
  if (axios.isAxiosError(err)) {
    return err.response?.status === 403;
  }
  return false;
}

/**
 * Check if an error is a server error (5xx)
 */
export function isServerError(err: unknown): boolean {
  if (isApiErrorFromClient(err)) {
    const status = (err as ApiErrorExtended).status;
    return status !== undefined && status >= 500 && status < 600;
  }
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    return status !== undefined && status >= 500 && status < 600;
  }
  return false;
}

/**
 * Get the HTTP status code from an error
 */
export function getStatusCode(err: unknown): number | undefined {
  if (isApiErrorFromClient(err)) {
    return (err as ApiErrorExtended).status;
  }
  if (axios.isAxiosError(err)) {
    return err.response?.status;
  }
  return undefined;
}

/**
 * Get error data from an error (the response body)
 */
export function getErrorData(err: unknown): unknown {
  if (isApiErrorFromClient(err)) {
    return (err as ApiErrorExtended).data;
  }
  if (axios.isAxiosError(err)) {
    return err.response?.data;
  }
  return undefined;
}
