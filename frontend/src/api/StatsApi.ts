/**
 * API layer for statistics.
 */
import { api } from './client';

export interface GlobalStats {
  total_ranges: number;
  total_users: number;
  total_sessions: number;
  total_hands: number;
  avg_score: number;
  most_common_action: string;
}

export interface UserStats {
  user_id: number;
  total_sessions: number;
  avg_score: number;
  total_time_spent: number;
  best_score: number;
  most_played_range: string;
}

export class StatsApi {
  async global(): Promise<GlobalStats> {
    const response = await api.get<GlobalStats>('/stats/global');
    return response.data;
  }

  async byUser(userId: number): Promise<UserStats> {
    const response = await api.get<UserStats>(`/stats/user/${userId}`);
    return response.data;
  }

  async byRange(rangeId: number): Promise<Record<string, unknown>> {
    const response = await api.get(`/stats/range/${rangeId}`);
    return response.data;
  }

  async history(): Promise<unknown> {
    const response = await api.get('/stats/history');
    return response.data;
  }

  async leaderboard(): Promise<unknown> {
    const response = await api.get('/stats/leaderboard');
    return response.data;
  }

  async rangeProgress(rangeId: number): Promise<unknown> {
    const response = await api.get(`/stats/range/${rangeId}/progress`);
    return response.data;
  }

  async export(format: 'json' | 'csv' = 'json'): Promise<unknown> {
    const response = await api.get(`/stats/export?format=${format}`);
    return response.data;
  }

  async backup(): Promise<unknown> {
    const response = await api.get('/stats/backup');
    return response.data;
  }
}
