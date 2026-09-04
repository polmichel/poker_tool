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
    const body = axiosErr.response?.data as { error?: string; message?: string } | undefined;
    
    // Try to get error message from response data
    if (body?.error) return body.error;
    if (body?.message) return body.message;
    
    // Fall back to status text or axios message
    if (axiosErr.response?.statusText) return axiosErr.response.statusText;
    if (axiosErr.message) return axiosErr.message;
    
    return defaultMessage;
  }

  // Check if it's a generic Error with message
  if (useMessage && err instanceof Error && err.message) return err.message;

  // For any other type (strings, objects, etc.)
  const errorObj = err as { message?: string; error?: string; response?: { data?: { error?: string } } };
  if (errorObj.error) return errorObj.error;
  if (errorObj.message) return errorObj.message;
  if (errorObj.response?.data?.error) return errorObj.response.data.error;

  // Return default message
  return defaultMessage;
}

