/**
 * Test mocks
 *
 * Helpers to build fake API class instances whose methods return controlled
 * promises, mirroring the real class shape so they type-check against the
 * `jest.Mocked<T>` pattern used by existing hook tests.
 */
import { AuthApi } from '../api/AuthApi';
import { RangesApi } from '../api/RangesApi';
import { StatsApi } from '../api/StatsApi';
import { EquityApi } from '../api/EquityApi';
import { TrainingApi } from '../api/TrainingApi';
import { makeRange } from './factories';

function makeMockedInstance<T>(methodNames: string[]): jest.Mocked<T> {
  const fake: Record<string, jest.Mock> = {};
  for (const method of methodNames) {
    fake[method] = jest.fn();
  }
  return fake as unknown as jest.Mocked<T>;
}

export function makeMockAuthApi(): jest.Mocked<AuthApi> {
  return makeMockedInstance<AuthApi>(['login', 'register', 'logout', 'me', 'refresh', 'verify']);
}

export function makeMockRangesApi(): jest.Mocked<RangesApi> {
  return makeMockedInstance<RangesApi>([
    'ranges',
    'range',
    'create',
    'update',
    'delete',
    'rangesByUser',
    'search',
    'grid',
    'stats',
    'exportRange',
    'importRange',
  ]);
}

export function makeMockStatsApi(): jest.Mocked<StatsApi> {
  return makeMockedInstance<StatsApi>([
    'global',
    'user',
    'byUser',
    'training',
    'ranges',
    'history',
    'leaderboard',
    'export',
    'recentActivity',
  ]);
}

export function makeMockEquityApi(): jest.Mocked<EquityApi> {
  return makeMockedInstance<EquityApi>([
    'calculate',
    'simulate',
    'calculateWithBoard',
    'calculateRangeVsRange',
    'calculateRangeVsHand',
    'getEquityTable',
  ]);
}

export function makeMockTrainingApi(): jest.Mocked<TrainingApi> {
  return makeMockedInstance<TrainingApi>([
    'modes',
    'sessions',
    'list',
    'createSession',
    'session',
    'start',
    'answer',
    'end',
    'sessionsByUser',
  ]);
}

/**
 * Returns a RangesApi fake pre-wired to resolve `ranges()` with the given
 * list (or a single default range when omitted). Convenient for hooks that
 * auto-fetch on mount.
 */
export function mockRangesApiResolving(ranges = [makeRange()]): jest.Mocked<RangesApi> {
  const api = makeMockRangesApi();
  api.ranges.mockResolvedValue(ranges);
  return api;
}
