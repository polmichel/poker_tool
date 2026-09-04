/**
 * Statistics domain types
 * Types for user statistics, global statistics, and equity calculations
 */
import { z } from 'zod';

// ============================================================================
// Global Statistics Types
// ============================================================================

export const GlobalStatsSchema = z.object({
  total_ranges: z.number(),
  total_training_sessions: z.number(),
  avg_score: z.number(),
  total_time_spent: z.number(),
  total_users: z.number().optional(),
});
export type GlobalStats = z.infer<typeof GlobalStatsSchema>;

// ============================================================================
// User Statistics Types
// ============================================================================

export const UserStatsSchema = z.object({
  user_id: z.number(),
  total_sessions: z.number(),
  avg_score: z.number(),
  total_time_spent: z.number(),
  total_ranges: z.number(),
  best_score: z.number().optional(),
  worst_score: z.number().optional(),
});
export type UserStats = z.infer<typeof UserStatsSchema>;

// ============================================================================
// Stats Types (original)
// ============================================================================

export const StatsSchema = z.object({
  total_ranges: z.number(),
  total_training_sessions: z.number(),
  avg_score: z.number(),
  total_time_spent: z.number(),
});
export type Stats = z.infer<typeof StatsSchema>;

// ============================================================================
// Equity Types
// ============================================================================

export const EquityByHandSchema = z.object({
  hand: z.string(),
  combos: z.number(),
  win: z.number(),
  tie: z.number(),
  lose: z.number(),
});
export type EquityByHand = z.infer<typeof EquityByHandSchema>;

export const EquityResultSchema = z.object({
  hero: z.string(),
  win: z.number(),
  tie: z.number(),
  lose: z.number(),
  iterations: z.number(),
  by_hand: z.array(EquityByHandSchema),
});
export type EquityResult = z.infer<typeof EquityResultSchema>;

// ============================================================================
// Equity Missing Response Types
// ============================================================================

export const EquityMissingResponseSchema = z.object({
  error: z.string(),
  missing: z.array(z.string()),
});
export type EquityMissingResponse = z.infer<typeof EquityMissingResponseSchema>;
