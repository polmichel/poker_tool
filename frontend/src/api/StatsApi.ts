/**
 * API layer for statistics.
 * Uses Zod validation for all responses.
 */
import { api, extractErrorMessage } from './client';
import { validateApiResponse } from '../utils/validation';
import type { GlobalStats, UserStats } from '../types/domain/stats';
import { GlobalStatsResponseSchema, UserStatsResponseSchema } from '../types/api/responses';
import type { GlobalStatsResponse, UserStatsResponse } from '../types/api/responses';

// Re-export types for backward compatibility
export type { GlobalStats, UserStats };

/**
 * Statistics API client with Zod validation
 */
export class StatsApi {
  /**
   * Get global statistics
   */
  async global(): Promise<GlobalStats> {
    try {
      const response = await api.get('/stats/global');
      return validateApiResponse<GlobalStatsResponse>(GlobalStatsResponseSchema, response.data);
    } catch (error) {
      // For Axios errors with response data containing error message, use that
      const errorData = (error as { response?: { data?: { error?: string } } }).response?.data;
      if (errorData?.error) {
        throw new Error(errorData.error);
      }
      throw new Error(extractErrorMessage(error, 'Failed to fetch global stats'));
    }
  }

  /**
   * Get statistics for a specific user
   */
  async user(userId: number): Promise<UserStats> {
    try {
      const response = await api.get(`/stats/user/${userId}`);
      return validateApiResponse<UserStatsResponse>(UserStatsResponseSchema, response.data);
    } catch (error) {
      const errorData = (error as { response?: { data?: { error?: string } } }).response?.data;
      if (errorData?.error) {
        throw new Error(errorData.error);
      }
      throw new Error(
        extractErrorMessage(error, `Failed to fetch stats for user ${userId}`)
      );
    }
  }

  /**
   * Get statistics by user - backward compatible method
   * @deprecated Use user() instead
   */
  async byUser(userId: number): Promise<UserStats> {
    return this.user(userId);
  }

  /**
   * Get training statistics for a specific user
   */
  async training(userId: number): Promise<{
    total_sessions: number;
    avg_score: number;
    total_time_spent: number;
    best_score: number;
    worst_score: number;
  }> {
    try {
      const response = await api.get(`/stats/training/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to fetch training stats for user ${userId}`)
      );
    }
  }

  /**
   * Get range statistics for a specific user
   */
  async ranges(userId: number): Promise<{
    total_ranges: number;
    by_type: Record<string, number>;
    by_position: Record<string, number>;
  }> {
    try {
      const response = await api.get(`/stats/ranges/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to fetch range stats for user ${userId}`)
      );
    }
  }

  /**
   * Get recent activity for a user
   */
  async recentActivity(userId: number, limit?: number): Promise<{
    sessions: Array<{
      id: number;
      type: string;
      score: number;
      date: string;
    }>;
    ranges: Array<{
      id: number;
      name: string;
      date: string;
    }>;
  }> {
    try {
      const url = limit ? `/stats/activity/${userId}?limit=${limit}` : `/stats/activity/${userId}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, `Failed to fetch recent activity for user ${userId}`)
      );
    }
  }
}
