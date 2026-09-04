/**
 * Poker domain types
 * Core types for poker hands, ranks, suits, and actions
 */
import { z } from 'zod';

// ============================================================================
// Basic Poker Types
// ============================================================================

export const RankSchema = z.enum([
  'A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2',
]);
export type Rank = z.infer<typeof RankSchema>;

export const SuitSchema = z.enum(['s', 'h', 'd', 'c']);
export type Suit = z.infer<typeof SuitSchema>;

// ============================================================================
// Hand Types
// ============================================================================

export const HandSchema = z.object({
  rank1: RankSchema,
  rank2: RankSchema,
  suited: z.boolean(),
  is_pair: z.boolean().optional(),
  notation: z.string(),
});
export type Hand = z.infer<typeof HandSchema>;

// ============================================================================
// Action Types
// ============================================================================

export const ActionTypeSchema = z.enum([
  'open',
  'call',
  'raise',
  'all_in',
  'fold',
  'check',
  'defense',
  'defense_3bet',
  'defense_4bet',
  'undefined',
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

// ============================================================================
// Position Types
// ============================================================================

export const PositionSchema = z.enum([
  'UTG',
  'UTG+1',
  'LJ',
  'HJ',
  'CO',
  'BTN',
  'SB',
  'BB',
  'undefined',
]);
export type Position = z.infer<typeof PositionSchema>;

// ============================================================================
// Range Types
// ============================================================================

export const RangeTypeSchema = z.enum(['preflop', 'postflop', 'push_fold']);
export type RangeType = z.infer<typeof RangeTypeSchema>;

// Hands record: mapping of hand notation to action
export const HandsRecordSchema = z.record(z.string(), ActionTypeSchema);
export type HandsRecord = z.infer<typeof HandsRecordSchema>;

export const RangeSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string(),
  range_type: RangeTypeSchema,
  position: PositionSchema,
  effective_stack_bb: z.number().nullable().optional(),
  hands: HandsRecordSchema,
  user_id: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Range = z.infer<typeof RangeSchema>;

// ============================================================================
// Scenario Types
// ============================================================================

export const ScenarioTypeSchema = z.enum([
  'cash_game',
  'tournament',
  'push_fold',
  'heads_up',
]);
export type ScenarioType = z.infer<typeof ScenarioTypeSchema>;

export const ScenarioSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string(),
  scenario_type: ScenarioTypeSchema,
  stack_size: z.number().optional(),
  position: PositionSchema,
  action: z.string(),
  range_id: z.number().optional(),
  user_id: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;
