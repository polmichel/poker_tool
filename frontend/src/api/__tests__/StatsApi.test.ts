/**
 * StatsApi unit tests
 *
 * Uses axios-mock-adapter on the shared `api` instance to assert the stats
 * API hits the right endpoints and validates Zod-validated responses.
 */
import MockAdapter from 'axios-mock-adapter';
import { api } from '../client';
import { StatsApi } from '../StatsApi';
import { makeGlobalStats, makeUserStats } from '../../tests/factories';

describe('StatsApi', () => {
  let statsApi: StatsApi;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    statsApi = new StatsApi();
    mockAxios = new MockAdapter(api);
    localStorage.clear();
  });

  afterEach(() => {
    mockAxios.restore();
    localStorage.clear();
  });

  it('fetches global stats', async () => {
    const stats = makeGlobalStats();
    mockAxios.onGet('/stats/global').reply(200, stats);
    const result = await statsApi.global();
    expect(result.total_ranges).toBe(2);
    expect(result.total_sessions).toBe(3);
  });

  it('fetches user stats by id', async () => {
    const stats = makeUserStats({ user_id: 5 });
    mockAxios.onGet('/stats/user/5').reply(200, stats);
    const result = await statsApi.user(5);
    expect(result.user_id).toBe(5);
    expect(result.best_score).toBe(90);
  });

  it('byUser() delegates to user()', async () => {
    const stats = makeUserStats({ user_id: 3 });
    mockAxios.onGet('/stats/user/3').reply(200, stats);
    const result = await statsApi.byUser(3);
    expect(result.user_id).toBe(3);
  });

  it('fetches training stats for a user', async () => {
    const trainingStats = {
      total_sessions: 4,
      avg_score: 80,
      total_time_spent: 600,
      best_score: 95,
      worst_score: 60,
    };
    mockAxios.onGet('/stats/training/1').reply(200, trainingStats);
    const result = await statsApi.training(1);
    expect(result.total_sessions).toBe(4);
    expect(result.avg_score).toBe(80);
  });

  it('fetches range stats for a user', async () => {
    const rangeStats = {
      total_ranges: 5,
      by_type: { preflop: 3, postflop: 2 },
      by_position: { BTN: 2, UTG: 3 },
    };
    mockAxios.onGet('/stats/ranges/1').reply(200, rangeStats);
    const result = await statsApi.ranges(1);
    expect(result.total_ranges).toBe(5);
    expect(result.by_type.preflop).toBe(3);
  });

  it('fetches training history', async () => {
    const history = [{ id: 1, score: 85 }];
    mockAxios.onGet('/stats/history').reply(200, history);
    const result = await statsApi.history();
    expect(result).toEqual(history);
  });

  it('fetches the leaderboard', async () => {
    const board = [{ user_id: 1, avg_score: 90 }];
    mockAxios.onGet('/stats/leaderboard').reply(200, board);
    const result = await statsApi.leaderboard();
    expect(result).toEqual(board);
  });

  it('exports stats in the requested format', async () => {
    const exported = { exported: true };
    mockAxios.onGet('/stats/export?format=csv').reply(200, exported);
    const result = await statsApi.export('csv');
    expect(result).toEqual(exported);
    expect(mockAxios.history.get[0].url).toContain('format=csv');
  });

  it('fetches recent activity with a limit', async () => {
    const activity = { sessions: [], ranges: [] };
    mockAxios.onGet('/stats/activity/1?limit=5').reply(200, activity);
    const result = await statsApi.recentActivity(1, 5);
    expect(result.sessions).toEqual([]);
    expect(mockAxios.history.get[0].url).toContain('limit=5');
  });

  it('rejects when global stats response is invalid (Zod validation)', async () => {
    mockAxios.onGet('/stats/global').reply(200, { total_ranges: 1 });
    await expect(statsApi.global()).rejects.toThrow();
  });

  it('surfaces the backend error message when a request fails', async () => {
    mockAxios.onGet('/stats/global').reply(500, { message: 'Stats boom' });
    await expect(statsApi.global()).rejects.toThrow(/Stats boom/);
  });

  it('attaches the bearer token when one is stored', async () => {
    localStorage.setItem('poker_tool_token', 'abc123');
    mockAxios.onGet('/stats/global').reply(200, makeGlobalStats());
    await statsApi.global();
    const request = mockAxios.history.get[0];
    expect(request.headers?.Authorization).toBe('Bearer abc123');
  });
});
