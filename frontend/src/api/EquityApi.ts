/**
 * API layer for equity calculations.
 * Uses Zod validation for all responses.
 */
import { api, extractErrorMessage } from './client';
import { EquityResultSchema } from '../types/domain/stats';
import { EquityRequestSchema } from '../types/api/requests';
import { validate, validateApiResponse } from '../utils/validation';
import type { EquityResult } from '../types/domain/stats';
import type { EquityRequest } from '../types/api/requests';

/**
 * Custom error for equity calculations
 */
export class EquityMissingError extends Error {
  constructor(
    message: string,
    public readonly missing: string[],
  ) {
    super(message);
    this.name = 'EquityMissingError';
  }
}

/**
 * Equity API client with Zod validation
 */
export class EquityApi {
  /**
   * Calculate equity between hero and villain hands
   */
  async calculate(request: EquityRequest): Promise<EquityResult> {
    try {
      const validatedRequest = validate(EquityRequestSchema, request);
      // The backend exposes /equity/simulate and reads the opposing range
      // under the `range` field (not `villain`).
      const payload = {
        hero: validatedRequest.hero,
        range: validatedRequest.villain,
        board: validatedRequest.board,
        iterations: validatedRequest.iterations,
      };
      const response = await api.post<EquityResult>('/equity/simulate', payload);
      return validateApiResponse(EquityResultSchema, response.data);
    } catch (error) {
      // The backend returns 409 with a `missing` list when the exact equity
      // table cannot answer every hand in the range.
      const apiError = error as { status?: number; data?: unknown };
      if (apiError.status === 409) {
        const errorData = apiError.data;
        if (errorData && typeof errorData === 'object') {
          const missing = (errorData as Record<string, unknown>).missing;
          if (Array.isArray(missing)) {
            throw new EquityMissingError(
              extractErrorMessage(error, 'Equity calculation failed - missing hands'),
              missing as string[],
            );
          }
        }
      }
      throw new Error(extractErrorMessage(error, 'Failed to calculate equity'));
    }
  }

  /**
   * Simulate equity - backward compatible method
   * @deprecated Use calculate() instead
   */
  async simulate(hero: string, villain: string, iterations?: number): Promise<EquityResult> {
    return this.calculate({ hero, villain, iterations });
  }

  /**
   * Calculate equity with a specific board
   */
  async calculateWithBoard(
    hero: string,
    villain: string,
    board: string,
    iterations?: number,
  ): Promise<EquityResult> {
    try {
      const response = await api.post<EquityResult>('/equity/simulate', {
        hero,
        range: villain,
        board,
        iterations,
      });
      return validateApiResponse(EquityResultSchema, response.data);
    } catch (error) {
      // The backend returns 409 with a `missing` list when the exact equity
      // table cannot answer every hand in the range.
      const apiError = error as { status?: number; data?: unknown };
      if (apiError.status === 409) {
        const errorData = apiError.data;
        if (errorData && typeof errorData === 'object') {
          const missing = (errorData as Record<string, unknown>).missing;
          if (Array.isArray(missing)) {
            throw new EquityMissingError(
              extractErrorMessage(error, 'Equity calculation failed - missing hands'),
              missing as string[],
            );
          }
        }
      }
      throw new Error(extractErrorMessage(error, 'Failed to calculate equity with board'));
    }
  }

  /**
   * Calculate equity for range vs range
   */
  async calculateRangeVsRange(
    heroRange: string, // JSON string of range
    villainRange: string, // JSON string of range
    board?: string,
    iterations?: number,
  ): Promise<EquityResult> {
    try {
      const response = await api.post<EquityResult>('/equity/range-vs-range', {
        hero_range: heroRange,
        villain_range: villainRange,
        board,
        iterations,
      });
      return validateApiResponse(EquityResultSchema, response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to calculate range vs range equity'));
    }
  }

  /**
   * Calculate equity for range vs specific hand
   */
  async calculateRangeVsHand(
    heroRange: string, // JSON string of range
    villainHand: string,
    board?: string,
    iterations?: number,
  ): Promise<EquityResult> {
    try {
      const response = await api.post<EquityResult>('/equity/range-vs-hand', {
        hero_range: heroRange,
        villain_hand: villainHand,
        board,
        iterations,
      });
      return validateApiResponse(EquityResultSchema, response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to calculate range vs hand equity'));
    }
  }

  /**
   * Get equity table for a range vs all possible hands
   */
  async getEquityTable(
    heroRange: string, // JSON string of range
    board?: string,
  ): Promise<Record<string, EquityResult>> {
    try {
      const response = await api.post<Record<string, EquityResult>>('/equity/table', {
        hero_range: heroRange,
        board,
      });

      // Validate each entry in the table
      const table: Record<string, EquityResult> = {};
      for (const [hand, result] of Object.entries(response.data)) {
        table[hand] = validate(EquityResultSchema, result);
      }

      return table;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Failed to get equity table'));
    }
  }
}
