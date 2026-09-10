/**
 * API layer for ranges.
 * Uses Zod validation for all responses.
 */
import { api, extractErrorMessage } from './client';
import { validate, validateApiResponse } from '../utils/validation';
import type { Range } from '../types/domain/poker';
import type {
  CreateRangeRequest,
  UpdateRangeRequest,
  RangeListResponse,
  RangeResponse,
} from '../types/api';
import { RangeListResponseSchema, RangeResponseSchema } from '../types/api/responses';
import { CreateRangeRequestSchema, UpdateRangeRequestSchema } from '../types/api/requests';

/**
 * Ranges API client with Zod validation
 */
export class RangesApi {
  /**
   * Get all ranges
   */
  async ranges(): Promise<Range[]> {
    try {
      const response = await api.get('/ranges');
      const data = validateApiResponse<RangeListResponse>(RangeListResponseSchema, response.data);
      return data.ranges;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to fetch ranges'));
    }
  }

  /**
   * Get a specific range by ID
   */
  async range(rangeId: number): Promise<Range> {
    try {
      const response = await api.get(`/ranges/${rangeId}`);
      const data = validateApiResponse<RangeResponse>(RangeResponseSchema, response.data);
      return data.range;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to fetch range ${rangeId}`));
    }
  }

  /**
   * Create a new range
   */
  async create(rangeData: CreateRangeRequest): Promise<Range> {
    try {
      const validatedData = validate(CreateRangeRequestSchema, rangeData);
      const response = await api.post<RangeResponse>('/ranges', validatedData);
      const data = validateApiResponse<RangeResponse>(RangeResponseSchema, response.data);
      return data.range;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to create range'));
    }
  }

  /**
   * Update an existing range
   */
  async update(rangeId: number, rangeData: UpdateRangeRequest): Promise<Range> {
    try {
      const validatedData = validate(UpdateRangeRequestSchema, rangeData);
      const response = await api.put<RangeResponse>(`/ranges/${rangeId}`, validatedData);
      const data = validateApiResponse<RangeResponse>(RangeResponseSchema, response.data);
      return data.range;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to update range ${rangeId}`));
    }
  }

  /**
   * Delete a range
   */
  async delete(rangeId: number): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`/ranges/${rangeId}`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to delete range ${rangeId}`));
    }
  }

  /**
   * Get ranges for a specific user
   */
  async rangesByUser(userId: number): Promise<Range[]> {
    try {
      const response = await api.get(`/ranges/user/${userId}`);
      const data = validateApiResponse<RangeListResponse>(RangeListResponseSchema, response.data);
      return data.ranges;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to fetch ranges for user ${userId}`));
    }
  }

  /**
   * Search ranges by name or description
   */
  async search(query: string): Promise<Range[]> {
    try {
      const response = await api.get(`/ranges/search?q=${encodeURIComponent(query)}`);
      const data = validateApiResponse<RangeListResponse>(RangeListResponseSchema, response.data);
      return data.ranges;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to search ranges for query: ${query}`));
    }
  }
  /**
   * Get the 13x13 grid representation of a range
   */
  async grid(rangeId: number): Promise<Record<string, unknown>> {
    try {
      const response = await api.get(`/ranges/${rangeId}/grid`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to fetch grid for range ${rangeId}`));
    }
  }
  /**
   * Get statistics for a range
   */
  async stats(rangeId: number): Promise<Record<string, unknown>> {
    try {
      const response = await api.get(`/ranges/${rangeId}/stats`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to fetch stats for range ${rangeId}`));
    }
  }
  /**
   * Export a range in the given format (json, text, csv)
   */
  async exportRange(rangeId: number, format: 'json' | 'text' | 'csv' = 'json'): Promise<unknown> {
    try {
      const response = await api.get(`/ranges/export/${rangeId}?format=${format}`);
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, `Failed to export range ${rangeId}`));
    }
  }
  /**
   * Import a range from content in the given format (json, text, csv)
   */
  async importRange(content: string, format: 'json' | 'text' | 'csv' = 'json'): Promise<Range> {
    try {
      const response = await api.post<Range>('/ranges/import', { content, format });
      return response.data;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to import range'));
    }
  }
}
