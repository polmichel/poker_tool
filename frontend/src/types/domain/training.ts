/**
 * Training domain types
 * Types for training sessions, questions, and modes
 */
import { z } from 'zod';
import { ActionTypeSchema } from './poker';

// ============================================================================
// Training Mode Types
// ============================================================================

export const TrainingModeSchema = z.enum(['fill', 'guess', 'complete']);
export type TrainingMode = z.infer<typeof TrainingModeSchema>;

// Extended question types include grid_paint
export const TrainingQuestionKindSchema = z.union([
  TrainingModeSchema,
  z.literal('grid_paint'),
]);
export type TrainingQuestionKind = z.infer<typeof TrainingQuestionKindSchema>;

// ============================================================================
// Training Question Types
// ============================================================================

export const TrainingQuestionSchema = z.object({
  type: TrainingQuestionKindSchema,
  hand: z.string(),
  question: z.string(),
  correct_answer: z.string(),
  // Mode "Deviner une range" : noms de ranges proposés en QCM
  options: z.array(z.string()).optional(),
  // Mode "Deviner une range" : grille 169 cellules sérialisée en JSON
  grid: z.string().optional(),
});
export type TrainingQuestion = z.infer<typeof TrainingQuestionSchema>;

// ============================================================================
// Training Session Types
// ============================================================================

export const TrainingSessionSchema = z.object({
  id: z.number().optional(),
  user_id: z.number().optional(),
  range_id: z.number(),
  mode: TrainingModeSchema,
  score: z.number(),
  total_questions: z.number(),
  correct_answers: z.number(),
  time_spent: z.number(),
  details: z.object({
    questions: z.array(TrainingQuestionSchema).optional(),
    current_question: z.number().optional(),
    start_time: z.string().optional(),
  }).optional(),
  created_at: z.string().optional(),
});
export type TrainingSession = z.infer<typeof TrainingSessionSchema>;

// ============================================================================
// Training Progress Types
// ============================================================================

export const ProgressSchema = z.object({
  current: z.number(),
  total: z.number(),
  correct: z.number(),
  score: z.number().optional(),
});
export type Progress = z.infer<typeof ProgressSchema>;

// ============================================================================
// Feedback Types (for training question feedback)
// ============================================================================

export const FeedbackSchema = z.object({
  isCorrect: z.boolean(),
  correctAnswer: z.string().nullable(),
  sessionComplete: z.boolean(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

// ============================================================================
// Range Grid Types (for visual representation)
// ============================================================================

// Status for grid cell comparison
export const RangeGridCellStatusSchema = z.enum(['correct', 'wrong']);
export type RangeGridCellStatus = z.infer<typeof RangeGridCellStatusSchema>;

export const RangeGridCellSchema = z.object({
  hand: z.string(),
  action: ActionTypeSchema,
  color: z.string(),
  status: RangeGridCellStatusSchema.optional(),
});
export type RangeGridCell = z.infer<typeof RangeGridCellSchema>;

export type RangeGrid = RangeGridCell[][];
