/**
 * Test fixtures for ranges
 * These are mock data used in E2E tests
 */

import { Range, RangeType, Position, ActionType } from '../../../src/types';

// Mock range data for testing
export const mockRange: Range = {
  id: 1,
  name: 'Test Range',
  description: 'A test range for E2E testing',
  range_type: 'preflop' as RangeType,
  position: 'BTN' as Position,
  hands: {
    'AA': 'raise' as ActionType,
    'KK': 'raise' as ActionType,
    'QQ': 'open' as ActionType,
    'AKs': 'open' as ActionType,
    'AKo': 'call' as ActionType,
    'JJ': 'fold' as ActionType,
  },
  user_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockRange2: Range = {
  id: 2,
  name: 'Tight Range',
  description: 'A tight range for testing',
  range_type: 'preflop' as RangeType,
  position: 'UTG' as Position,
  hands: {
    'AA': 'raise' as ActionType,
    'KK': 'raise' as ActionType,
    'AKs': 'open' as ActionType,
  },
  user_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const mockEmptyRange: Range = {
  id: 3,
  name: 'Empty Range',
  description: 'An empty range for testing edge cases',
  range_type: 'preflop' as RangeType,
  position: 'BB' as Position,
  hands: {},
  user_id: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Array of mock ranges
export const mockRanges: Range[] = [mockRange, mockRange2, mockEmptyRange];

// New range data for creation tests
export const newRangeData = {
  name: 'New Test Range',
  description: 'Created during E2E test',
  range_type: 'preflop' as RangeType,
  position: 'CO' as Position,
  hands: {
    'AA': 'raise' as ActionType,
    'KK': 'raise' as ActionType,
    'QQ': 'open' as ActionType,
  },
};

// Form data for range creation
export const rangeFormData = {
  rangeName: 'E2E Test Range',
  rangeDescription: 'Created by Playwright E2E test',
  rangeType: 'preflop',
  position: 'BTN',
};
