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
      const response = await api.post<EquityResult>('/equity/calculate', validatedRequest);
      return validateApiResponse(EquityResultSchema, response.data);
    } catch (error) {
      // Check if this is a missing hands error
      if (extractErrorMessage(error, '').includes('missing')) {
        const errorData = (error as { data?: unknown }).data;
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
      throw new Error(
        extractErrorMessage(error, 'Failed to calculate equity')
      );
    }
  }

  /**
   * Simulate equity - backward compatible method
   * @deprecated Use calculate() instead
   */
  async simulate(
    hero: string,
    villain: string,
    iterations?: number,
  ): Promise<EquityResult> {
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
      const response = await api.post<EquityResult>('/equity/calculate', {
        hero,
        villain,
        board,
        iterations,
      });
      return validateApiResponse(EquityResultSchema, response.data);
    } catch (error) {
      // Check if this is a missing hands error
      if (extractErrorMessage(error, '').includes('missing')) {
        // Try to extract missing hands from error
        const errorData = (error as { data?: unknown }).data;
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
      throw new Error(
        extractErrorMessage(error, 'Failed to calculate equity with board')
      );
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
      throw new Error(
        extractErrorMessage(error, 'Failed to calculate range vs range equity')
      );
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
      throw new Error(
        extractErrorMessage(error, 'Failed to calculate range vs hand equity')
      );
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
      const response = await api.post<Record<string, EquityResult>>(
        '/equity/table',
        {
          hero_range: heroRange,
          board,
        },
      );
      
      // Validate each entry in the table
      const table: Record<string, EquityResult> = {};
      for (const [hand, result] of Object.entries(response.data)) {
        table[hand] = validate(EquityResultSchema, result);
      }
      
      return table;
    } catch (error) {
      throw new Error(
        extractErrorMessage(error, 'Failed to get equity table')
      );
    }
  }
}
