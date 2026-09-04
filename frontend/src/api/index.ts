/**
 * API layer barrel export
 *
 * Each resource has a dedicated API class that encapsulates its HTTP calls.
 * Hooks depend on these instead of touching axios directly.
 */

export { api, API_BASE_URL, extractErrorMessage, isApiError, isNetworkError, isTimeoutError, isNotFoundError, isUnauthorizedError, isValidationError } from './client';
export { RangesApi } from './RangesApi';
export { AuthApi } from './AuthApi';
export { TrainingApi } from './TrainingApi';
export { StatsApi } from './StatsApi';
export { EquityApi, EquityMissingError } from './EquityApi';

// Re-export types from TrainingApi for backward compatibility
export type {
  CreateSessionPayload,
  CreateSessionResponse,
  NextQuestionResponse,
  SessionDetail,
} from './TrainingApi.types';

// Re-export all types from the types directory
export type {
  GlobalStats,
  UserStats,
} from '../types/domain/stats';
