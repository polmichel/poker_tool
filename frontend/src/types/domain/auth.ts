/**
 * Authentication domain types
 * Types for user authentication, tokens, and responses
 */
import { z } from 'zod';

// ============================================================================
// User Types
// ============================================================================

export const UserSchema = z.object({
  id: z.number().optional(),
  username: z.string(),
  email: z.string(),
  password: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

// ============================================================================
// Authentication Response Types
// ============================================================================

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ============================================================================
// Login Credentials Types
// ============================================================================

export const LoginCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// ============================================================================
// Registration Credentials Types
// ============================================================================

export const RegisterCredentialsSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});
export type RegisterCredentials = z.infer<typeof RegisterCredentialsSchema>;
