/**
 * API layer for ranges.
 *
 * Encapsulates every HTTP call to /api/ranges. Hooks depend on this instead
 * of touching axios directly, so the network contract lives in one place
 * and is easy to test/mock.
 */
import { api } from './client';
import { Range, ActionType } from '../types';

export class RangesApi {
  async all(): Promise<Range[]> {
    const response = await api.get<Range[]>('/ranges/');
    return response.data;
  }

  async byId(id: number): Promise<Range> {
    const response = await api.get<Range>(`/ranges/${id}`);
    return response.data;
  }

  async create(rangeData: Omit<Range, 'id' | 'created_at' | 'updated_at'>): Promise<Range> {
    const response = await api.post<Range>('/ranges/', rangeData);
    return response.data;
  }

  async update(id: number, rangeData: Partial<Range>): Promise<Range> {
    const response = await api.put<Range>(`/ranges/${id}`, rangeData);
    return response.data;
  }

  async remove(id: number): Promise<void> {
    await api.delete(`/ranges/${id}`);
  }

  async byUser(userId: number): Promise<Range[]> {
    const response = await api.get<Range[]>(`/ranges/user/${userId}`);
    return response.data;
  }

  async grid(id: number): Promise<Record<string, unknown>> {
    const response = await api.get(`/ranges/${id}/grid`);
    return response.data;
  }

  async stats(id: number): Promise<Record<string, unknown>> {
    const response = await api.get(`/ranges/${id}/stats`);
    return response.data;
  }

  async updateHand(rangeId: number, handStr: string, action: ActionType): Promise<Range> {
    const response = await api.put<Range>(`/ranges/${rangeId}/hands/${handStr}`, { action });
    return response.data;
  }

  async removeHand(rangeId: number, handStr: string): Promise<Range> {
    const response = await api.delete<Range>(`/ranges/${rangeId}/hands/${handStr}`);
    return response.data;
  }

  async exportRange(rangeId: number, format: 'json' | 'text' | 'csv' = 'json'): Promise<unknown> {
    const response = await api.get(`/ranges/export/${rangeId}?format=${format}`);
    return response.data;
  }

  async importRange(content: string, format: 'json' | 'text' | 'csv' = 'json'): Promise<Range> {
    const response = await api.post<Range>('/ranges/import', { content, format });
    return response.data;
  }

  async defaultRanges(): Promise<Range[]> {
    const response = await api.get<Range[]>('/ranges/default');
    return response.data;
  }
}
