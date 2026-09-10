/**
 * API Request Payload Types
 * Types for all API request payloads
 */
import { z } from 'zod';
import {
  RangeSchema,
  TrainingModeSchema,
  LoginCredentialsSchema,
  RegisterCredentialsSchema,
} from '../domain';

// ============================================================================
// Range Request Types
// ============================================================================

export const CreateRangeRequestSchema = RangeSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});
export type CreateRangeRequest = z.infer<typeof CreateRangeRequestSchema>;

export const UpdateRangeRequestSchema = RangeSchema.partial().omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});
export type UpdateRangeRequest = z.infer<typeof UpdateRangeRequestSchema>;

// ============================================================================
// Training Request Types
// ============================================================================

export const CreateSessionRequestSchema = z.object({
  mode: TrainingModeSchema,
  range_id: z.number(),
  user_id: z.number().optional(),
  total_questions: z.number().optional(),
});
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

export const AnswerRequestSchema = z.object({
  answer: z.string(),
});
export type AnswerRequest = z.infer<typeof AnswerRequestSchema>;

// ============================================================================
// Authentication Request Types
// ============================================================================

export const LoginRequestSchema = LoginCredentialsSchema;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = RegisterCredentialsSchema;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// ============================================================================
// Equity Request Types
// ============================================================================

export const EquityRequestSchema = z.object({
  hero: z.string(),
  villain: z.string(),
  board: z.string().optional(),
  iterations: z.number().optional(),
});
export type EquityRequest = z.infer<typeof EquityRequestSchema>;
