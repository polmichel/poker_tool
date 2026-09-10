/**
 * Test factories
 *
 * Centralised builders for domain objects so tests construct valid,
 * Zod-compatible data without repeating boilerplate. Each factory accepts
 * a partial override object and deep-merges sensible defaults.
 */
import type { Hand, Range, ActionType, Position, RangeType } from '../types/domain/poker';
import type {
  TrainingSession,
  TrainingQuestion,
  TrainingMode,
  Feedback,
} from '../types/domain/training';
import type { User, AuthResponse } from '../types/domain/auth';
import type { GlobalStats, UserStats, EquityResult, EquityByHand } from '../types/domain/stats';

export function makeHand(overrides: Partial<Hand> = {}): Hand {
  return {
    rank1: 'A',
    rank2: 'K',
    suited: true,
    is_pair: false,
    notation: 'AKs',
    ...overrides,
  };
}

export function makeRange(overrides: Partial<Range> = {}): Range {
  return {
    id: 1,
    name: 'Test Range',
    description: 'A test preflop range',
    range_type: 'preflop' as RangeType,
    position: 'BTN' as Position,
    effective_stack_bb: null,
    hands: { AKs: 'open' as ActionType, AQs: 'raise' as ActionType },
    user_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeTrainingQuestion(overrides: Partial<TrainingQuestion> = {}): TrainingQuestion {
  return {
    type: 'fill' as TrainingMode,
    hand: 'AKs',
    question: "Quelle est l'action pour AKs ?",
    correct_answer: 'open',
    ...overrides,
  };
}

export function makeTrainingSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 1,
    user_id: 1,
    range_id: 1,
    mode: 'fill' as TrainingMode,
    score: 85,
    total_questions: 10,
    correct_answers: 8,
    time_spent: 120,
    details: {
      questions: [makeTrainingQuestion()],
      current_question: 1,
      start_time: '2024-01-01T00:00:00Z',
    },
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
  return {
    isCorrect: true,
    correctAnswer: 'open',
    sessionComplete: false,
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeAuthResponse(overrides: Partial<AuthResponse> = {}): AuthResponse {
  return {
    access_token: 'test-token',
    user: makeUser(),
    ...overrides,
  };
}

export function makeGlobalStats(overrides: Partial<GlobalStats> = {}): GlobalStats {
  return {
    total_ranges: 2,
    total_sessions: 3,
    avg_score: 4.5,
    total_time_spent: 120,
    total_users: 1,
    ...overrides,
  };
}

export function makeUserStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    user_id: 1,
    total_sessions: 3,
    avg_score: 4.5,
    total_time_spent: 120,
    total_ranges: 2,
    best_score: 90,
    worst_score: 70,
    ...overrides,
  };
}

export function makeEquityByHand(overrides: Partial<EquityByHand> = {}): EquityByHand {
  return {
    hand: 'AKs',
    combos: 16,
    win: 0.65,
    tie: 0.02,
    lose: 0.33,
    ...overrides,
  };
}

export function makeEquityResult(overrides: Partial<EquityResult> = {}): EquityResult {
  return {
    hero: 'AKs',
    win: 0.65,
    tie: 0.02,
    lose: 0.33,
    iterations: 10000,
    by_hand: [makeEquityByHand()],
    ...overrides,
  };
}
