/**
 * API Response Types
 * Standardized response types for all API endpoints
 */
import { z } from 'zod';
import {
  RangeSchema,
  TrainingSessionSchema,
  TrainingQuestionSchema,
  UserSchema,
  GlobalStatsSchema,
  UserStatsSchema,
  EquityResultSchema,
} from '../domain';

// ============================================================================
// Generic API Response Types
// ============================================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// ============================================================================
// Paginated Response Types
// ============================================================================

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    total: z.number(),
    page: z.number(),
    per_page: z.number(),
  });

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
};

// ============================================================================
// Range API Response Types
// ============================================================================

export const RangeListResponseSchema = z.object({
  ranges: z.array(RangeSchema),
  total: z.number().optional(),
});
export type RangeListResponse = z.infer<typeof RangeListResponseSchema>;

export const RangeResponseSchema = z.object({
  range: RangeSchema,
});
export type RangeResponse = z.infer<typeof RangeResponseSchema>;

// ============================================================================
// Training API Response Types
// ============================================================================

// Training modes response
export const TrainingModeResponseSchema = z.array(
  z.object({
    value: z.string(),
    label: z.string(),
  }),
);
export type TrainingModeResponse = z.infer<typeof TrainingModeResponseSchema>;

// Training sessions list
export const TrainingSessionsResponseSchema = z.array(TrainingSessionSchema);
export type TrainingSessionsResponse = z.infer<typeof TrainingSessionsResponseSchema>;

// Create session response
export const CreateSessionResponseSchema = z.object({
  id: z.number(),
  session: TrainingSessionSchema,
  first_question: TrainingQuestionSchema.nullable(),
});
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;

// Session detail response
export const SessionDetailResponseSchema = z.object({
  id: z.number(),
  session: TrainingSessionSchema,
  current_question: TrainingQuestionSchema.nullable(),
  progress: z.object({
    current: z.number(),
    total: z.number(),
    correct: z.number(),
    score: z.number(),
  }),
});
export type SessionDetailResponse = z.infer<typeof SessionDetailResponseSchema>;

// Next question response
export const NextQuestionResponseSchema = z.object({
  is_correct: z.boolean(),
  correct_answer: z.string().nullable(),
  session_complete: z.boolean(),
  progress: z.object({
    current: z.number(),
    total: z.number(),
    correct: z.number(),
    score: z.number(),
  }),
  next_question: TrainingQuestionSchema.optional(),
});
export type NextQuestionResponse = z.infer<typeof NextQuestionResponseSchema>;

// ============================================================================
// Authentication API Response Types
// ============================================================================

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  user: UserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegisterResponseSchema = z.object({
  access_token: z.string(),
  user: UserSchema,
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// ============================================================================
// Statistics API Response Types
// ============================================================================

export const GlobalStatsResponseSchema = GlobalStatsSchema;
export type GlobalStatsResponse = z.infer<typeof GlobalStatsResponseSchema>;

export const UserStatsResponseSchema = UserStatsSchema;
export type UserStatsResponse = z.infer<typeof UserStatsResponseSchema>;

// ============================================================================
// Equity API Response Types
// ============================================================================

export const EquityResultResponseSchema = EquityResultSchema;
export type EquityResultResponse = z.infer<typeof EquityResultResponseSchema>;



// ============================================================================
// Error Response Types
// ============================================================================

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  status: z.number().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
