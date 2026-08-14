import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { useStats } from '../useStats';
import { StatsApi } from '../../api';

// Mock StatsApi so the hook is tested without any network layer.
// This follows the DI design: the hook accepts a StatsApi instance,
// so we inject a fake whose methods return controlled promises.
function makeFakeStatsApi() {
  const fake: any = {};
  for (const method of [
    'global',
    'byUser',
    'byRange',
    'history',
    'leaderboard',
    'rangeProgress',
    'export',
    'backup',
  ]) {
    fake[method] = jest.fn();
  }
  return fake as jest.Mocked<StatsApi>;
}

describe('useStats Hook', () => {
  beforeEach(() => {
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  });

  it('initializes with correct default values', () => {
    const fakeApi = makeFakeStatsApi();
    fakeApi.global.mockResolvedValue(null as any);
    const { result } = renderHook(() => useStats(fakeApi));
    expect(result.current.globalStats).toBeNull();
    expect(result.current.userStats).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches global stats successfully', async () => {
    const fakeApi = makeFakeStatsApi();
    const mockStats = {
      total_ranges: 2,
      total_users: 1,
      total_sessions: 3,
      total_hands: 5,
      avg_score: 4.5,
      most_common_action: 'RAISE',
    };
    fakeApi.global.mockResolvedValue(mockStats as any);
    const { result } = renderHook(() => useStats(fakeApi));

    await act(async () => {
      await result.current.fetchGlobalStats();
    });
    expect(result.current.globalStats).toEqual(mockStats);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('surfaces the backend JSON error message when fetching global stats fails', async () => {
    const fakeApi = makeFakeStatsApi();
    // Simulate the structured JSON 500 returned by StatsController.
    const axiosError = new axios.AxiosError(
      'Request failed with status code 500',
      '500',
      undefined,
      undefined,
      {
        status: 500,
        data: { error: 'Erreur lors du chargement des statistiques globales' },
      } as any,
    );
    fakeApi.global.mockRejectedValue(axiosError);
    const { result } = renderHook(() => useStats(fakeApi));

    await act(async () => {
      await result.current.fetchGlobalStats();
    });
    expect(result.current.error).toBe('Erreur lors du chargement des statistiques globales');
    expect(result.current.loading).toBe(false);
    expect(result.current.globalStats).toBeNull();
  });

  it('falls back to the default message for non-Error rejections', async () => {
    const fakeApi = makeFakeStatsApi();
    // A non-Error rejection (no .message) falls back to the default message.
    fakeApi.global.mockRejectedValue('something went wrong');
    const { result } = renderHook(() => useStats(fakeApi));

    await act(async () => {
      await result.current.fetchGlobalStats();
    });
    expect(result.current.error).toBe('Erreur lors du chargement des statistiques globales');
    expect(result.current.loading).toBe(false);
  });

  it('handles error when fetching user stats', async () => {
    const fakeApi = makeFakeStatsApi();
    const axiosError = new axios.AxiosError(
      'Request failed with status code 500',
      '500',
      undefined,
      undefined,
      {
        status: 500,
        data: { error: "Erreur lors du chargement des statistiques de l'utilisateur 1" },
      } as any,
    );
    fakeApi.byUser.mockRejectedValue(axiosError);
    const { result } = renderHook(() => useStats(fakeApi));

    await act(async () => {
      await result.current.fetchUserStats(1);
    });
    expect(result.current.error).toBe(
      "Erreur lors du chargement des statistiques de l'utilisateur 1",
    );
    expect(result.current.loading).toBe(false);
  });
});
