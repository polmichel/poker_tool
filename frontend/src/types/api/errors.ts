/**
 * API Error Types
 * Types for API errors and error handling
 */
import { z } from 'zod';

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const HttpStatusSchema = z.enum([
  200, 201, 204,
  400, 401, 403, 404, 409, 422,
  500, 502, 503, 504,
]);
export type HttpStatus = z.infer<typeof HttpStatusSchema>;

// ============================================================================
// API Error Types
// ============================================================================

export const ApiErrorSchema = z.object({
  message: z.string(),
  status: HttpStatusSchema.optional(),
  code: z.string().optional(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

// ============================================================================
// Validation Error Types
// ============================================================================

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.any(),
});
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const ValidationErrorsSchema = z.object({
  errors: z.array(ValidationErrorSchema),
  message: z.string().optional(),
});
export type ValidationErrors = z.infer<typeof ValidationErrorsSchema>;

// ============================================================================
// Authentication Error Types
// ============================================================================

export const AuthErrorSchema = z.object({
  type: z.enum(['invalid_credentials', 'token_expired', 'token_invalid', 'user_not_found']),
  message: z.string(),
});
export type AuthError = z.infer<typeof AuthErrorSchema>;

// ============================================================================
// Network Error Types
// ============================================================================

export const NetworkErrorSchema = z.object({
  type: z.literal('network_error'),
  message: z.string(),
  originalError: z.any().optional(),
});
export type NetworkError = z.infer<typeof NetworkErrorSchema>;

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Type guard to check if an error is a ValidationErrors
 */
export function isValidationErrors(error: unknown): error is ValidationErrors {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as Record<string, unknown>).errors)
  );
}

/**
 * Type guard to check if an error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as Record<string, unknown>).type === 'network_error'
  );
}

/**
 * Extract error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isApiError(error)) {
    return error.message;
  }
  if (isValidationErrors(error)) {
    return error.message || 'Validation failed';
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
