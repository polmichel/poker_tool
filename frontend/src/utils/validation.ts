/**
 * Validation Utilities
 * Runtime validation utilities using Zod schemas
 */
import { z, ZodSchema, ZodError } from 'zod';

// ============================================================================
// Core Validation Functions
// ============================================================================

/**
 * Validate data against a Zod schema
 * Throws ZodError if validation fails
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The validated and parsed data
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns a result object instead of throwing
 *
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Result object with success flag and data/error
 */
export function safeValidate<T>(schema: ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: ZodError;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate and transform data in one step
 *
 * @param schema - The Zod schema to validate and transform against
 * @param data - The data to validate and transform
 * @returns The validated, parsed, and transformed data
 */
export function validateAndTransform<T, U>(
  schema: ZodSchema<T, z.ZodTypeDef, U>,
  data: unknown,
): U {
  return schema.parse(data);
}

// ============================================================================
// API Response Validation
// ============================================================================

/**
 * Validate an API response
 *
 * @param schema - The schema for the response data
 * @param response - The full API response object
 * @returns The validated data from the response
 */
export function validateApiResponse<T>(
  schema: ZodSchema<T>,
  response: unknown,
): T {
  // Handle different response formats
  if (typeof response === 'object' && response !== null) {
    const obj = response as Record<string, unknown>;
    
    // If response has a 'data' field, validate that
    if ('data' in obj) {
      return validate(schema, obj.data);
    }
    
    // Otherwise, validate the whole response
    return validate(schema, response);
  }
  
  return validate(schema, response);
}

/**
 * Validate a paginated API response
 *
 * @param dataSchema - The schema for individual data items
 * @param response - The paginated response
 * @returns The validated paginated data
 */
export function validatePaginatedResponse<T>(
  dataSchema: ZodSchema<T>,
  response: unknown,
): { data: T[]; total: number; page: number; per_page: number } {
  const paginatedSchema = z.object({
    data: z.array(dataSchema),
    total: z.number(),
    page: z.number(),
    per_page: z.number(),
  });
  
  return validate(paginatedSchema, response);
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Format Zod validation errors into a readable string
 *
 * @param error - The ZodError to format
 * @returns A formatted error message string
 */
export function formatZodError(error: ZodError): string {
  const errors = error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  return `Validation failed: ${errors.join(', ')}`;
}

/**
 * Format Zod validation errors into an object by field
 *
 * @param error - The ZodError to format
 * @returns An object mapping field paths to error messages
 */
export function formatZodErrorByField(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  for (const err of error.errors) {
    const path = err.path.join('.');
    fieldErrors[path] = err.message;
  }
  
  return fieldErrors;
}

/**
 * Create a validation error response
 *
 * @param error - The ZodError to convert
 * @returns A standardized error response
 */
export function createValidationError(error: ZodError) {
  return {
    success: false,
    error: 'VALIDATION_ERROR',
    message: formatZodError(error),
    details: formatZodErrorByField(error),
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a ZodError
 *
 * @param value - The value to check
 * @returns True if the value is a ZodError
 */
export function isZodError(value: unknown): value is ZodError {
  return value instanceof ZodError;
}

/**
 * Check if a value is a validation error response
 *
 * @param value - The value to check
 * @returns True if the value is a validation error response
 */
export function isValidationErrorResponse(value: unknown): value is {
  success: false;
  error: string;
  message: string;
  details: Record<string, string>;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    value.success === false &&
    'error' in value &&
    value.error === 'VALIDATION_ERROR'
  );
}

// ============================================================================
// Schema Utilities
// ============================================================================

/**
 * Create a schema that validates an array of items
 *
 * @param itemSchema - The schema for individual items
 * @returns A schema for an array of those items
 */
export function arraySchema<T>(itemSchema: ZodSchema<T>): ZodSchema<T[]> {
  return z.array(itemSchema);
}

/**
 * Create a schema that validates an optional value
 *
 * @param schema - The base schema
 * @returns A schema that accepts the base type or undefined
 */
export function optionalSchema<T>(
  schema: ZodSchema<T>,
): ZodSchema<T | undefined> {
  return schema.optional();
}

/**
 * Create a schema that validates a nullable value
 *
 * @param schema - The base schema
 * @returns A schema that accepts the base type or null
 */
export function nullableSchema<T>(schema: ZodSchema<T>): ZodSchema<T | null> {
  return schema.nullable();
}

/**
 * Create a schema that validates a value that can be null or undefined
 *
 * @param schema - The base schema
 * @returns A schema that accepts the base type, null, or undefined
 */
export function nullishSchema<T>(
  schema: ZodSchema<T>,
): ZodSchema<T | null | undefined> {
  return schema.nullish();
}

/**
 * Create a schema with a default value
 *
 * @param schema - The base schema
 * @param defaultValue - The default value to use
 * @returns A schema with the default value
 */
export function withDefault<T>(
  schema: ZodSchema<T>,
  defaultValue: T | (() => T),
): ZodSchema<T> {
  return schema.default(defaultValue);
}

// ============================================================================
// Common Validators
// ============================================================================

/**
 * Validate that a string is not empty
 */
export const nonEmptyString = z.string().min(1, { message: 'Cannot be empty' });

/**
 * Validate that a string is a valid email
 */
export const emailString = z
  .string()
  .min(1, { message: 'Cannot be empty' })
  .email({ message: 'Invalid email format' });

/**
 * Validate that a string is a valid password (minimum 8 characters)
 */
export const passwordString = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' });

/**
 * Validate that a number is positive
 */
export const positiveNumber = z.number().positive({ message: 'Must be positive' });

/**
 * Validate that a number is non-negative
 */
export const nonNegativeNumber = z
  .number()
  .nonnegative({ message: 'Must be non-negative' });

/**
 * Validate that a number is within a range
 */
export function numberInRange(min: number, max: number) {
  return z.number().min(min).max(max);
}

/**
 * Validate that a string has a minimum length
 */
export function stringMinLength(min: number) {
  return z.string().min(min, { message: `Must be at least ${min} characters` });
}

/**
 * Validate that a string has a maximum length
 */
export function stringMaxLength(max: number) {
  return z.string().max(max, { message: `Must be at most ${max} characters` });
}

/**
 * Validate that a string is within a length range
 */
export function stringLengthRange(min: number, max: number) {
  return z.string().min(min).max(max);
}
