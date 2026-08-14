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
}
