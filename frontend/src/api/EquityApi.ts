/**
 * API layer for the equity simulator.
 *
 * Encapsulates the HTTP call to POST /api/equity/simulate.
 */
import { api } from './client';
import { EquityResult } from '../types';

export class EquityApi {
  async simulate(hero: string, range: string, iterations: number = 10000): Promise<EquityResult> {
    const response = await api.post<EquityResult>('/equity/simulate', {
      hero,
      range,
      iterations,
    });
    return response.data;
  }
}
