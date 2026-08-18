/**
 * API layer for the equity simulator.
 *
 * Encapsulates the HTTP call to POST /api/equity/simulate.
 *
 * - Without `iterations`: the backend answers with the exact pre-computed
 *   table (instant, reproducible), or 409 with `missing` when the table is
 *   incomplete (the caller should then retry with `iterations`).
 * - With `iterations`: the backend runs the Monte-Carlo engine.
 */
import { AxiosError } from 'axios';
import { api } from './client';
import { EquityMissingResponse, EquityResult } from '../types';

/** Error thrown when the exact table is incomplete (HTTP 409). */
export class EquityMissingError extends Error {
  public readonly missing: string[];

  constructor(missing: string[], message = 'Équité exacte indisponible') {
    super(message);
    this.name = 'EquityMissingError';
    this.missing = missing;
  }
}

export class EquityApi {
  async simulate(
    hero: string,
    range: string,
    iterations?: number,
  ): Promise<EquityResult> {
    try {
      const response = await api.post<EquityResult>('/equity/simulate', {
        hero,
        range,
        ...(iterations !== undefined ? { iterations } : {}),
      });
      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError<EquityMissingResponse>;
      if (axiosErr.response?.status === 409 && axiosErr.response.data?.missing) {
        throw new EquityMissingError(axiosErr.response.data.missing, axiosErr.response.data.error);
      }
      throw err;
    }
  }
}
