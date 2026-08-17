/**
 * API layer barrel.
 *
 * Each resource has a dedicated API class that encapsulates its HTTP calls.
 * Hooks depend on these instead of touching axios directly.
 */
export { api, API_BASE_URL } from './client';
export { RangesApi } from './RangesApi';
export { AuthApi } from './AuthApi';
export { TrainingApi } from './TrainingApi';
export type {
  CreateSessionPayload,
  CreateSessionResponse,
  NextQuestionResponse,
} from './TrainingApi';
export { StatsApi } from './StatsApi';
export type { GlobalStats, UserStats } from './StatsApi';
export { EquityApi } from './EquityApi';
