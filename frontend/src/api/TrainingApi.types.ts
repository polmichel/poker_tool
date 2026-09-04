/**
 * Training API Types
 * Backward compatibility types for TrainingApi
 * These types are re-exported from the main types directory
 */

// Re-export all types from the domain and API types
import type {
  TrainingMode,
  TrainingQuestion,
  TrainingSession,
  TrainingQuestionKind,
  Progress,
  Feedback,
  RangeGrid,
  RangeGridCell,
} from '../types/domain/training';

// Backward compatible types
export type { TrainingMode };
export type { TrainingQuestion };
export type { TrainingSession };
export type { TrainingQuestionKind };
export type { Progress };
export type { Feedback };
export type { RangeGrid };
export type { RangeGridCell };

// Specific types that were previously defined in this file
export interface CreateSessionPayload {
  mode: TrainingMode;
  range_id: number;
  total_questions?: number;
  user_id?: number;
}

export interface SessionDetail {
  id: number;
  session: TrainingSession;
  current_question: TrainingQuestion | null;
  progress: Progress;
}
