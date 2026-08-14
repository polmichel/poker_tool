import { getActionLabel, gridToHands, generateRangeGrid } from '../helpers';
import { ActionType, RangeGridCell } from '../../types';

describe('Helper Functions', () => {
  describe('getActionLabel', () => {
    it('returns correct label for open action', () => {
      expect(getActionLabel('open' as ActionType)).toBe('Ouvrir');
    });

    it('returns correct label for raise action', () => {
      expect(getActionLabel('raise' as ActionType)).toBe('Relancer');
    });

    it('returns correct label for call action', () => {
      expect(getActionLabel('call' as ActionType)).toBe('Suivre');
    });

    it('returns correct label for fold action', () => {
      expect(getActionLabel('fold' as ActionType)).toBe('Passer');
    });

    it('returns correct label for all_in action', () => {
      expect(getActionLabel('all_in' as ActionType)).toBe('All-In');
    });

    it('returns correct label for undefined action', () => {
      expect(getActionLabel('undefined' as ActionType)).toBe('Non défini');
    });
  });

  describe('gridToHands', () => {
    it('converts a grid to hands object', () => {
      const grid: RangeGridCell[][] = [
        [
          { hand: 'AA', action: 'open', color: '#4CAF50' },
          { hand: 'AKs', action: 'raise', color: '#2196F3' },
        ],
        [
          { hand: 'KK', action: 'open', color: '#4CAF50' },
          { hand: 'QQ', action: 'call', color: '#FF9800' },
        ],
      ];

      const result = gridToHands(grid);
      expect(result).toEqual({
        AA: 'open',
        AKs: 'raise',
        KK: 'open',
        QQ: 'call',
      });
    });

    it('returns empty object for empty grid', () => {
      const grid: RangeGridCell[][] = [];
      const result = gridToHands(grid);
      expect(result).toEqual({});
    });
  });

  describe('generateRangeGrid', () => {
    it('converts hands object to grid', () => {
      const hands: Record<string, ActionType> = {
        AA: 'open',
        AKs: 'raise',
        KK: 'open',
        QQ: 'call',
      };

      const result = generateRangeGrid(hands);
      // Should be a 13x13 grid
      expect(result.length).toBe(13);
      expect(result[0].length).toBe(13);

      // Check some specific hands
      const aaCell = result[0][0];
      expect(aaCell.hand).toBe('AA');
      expect(aaCell.action).toBe('open');

      const kkCell = result[1][1];
      expect(kkCell.hand).toBe('KK');
      expect(kkCell.action).toBe('open');
    });

    it('returns 13x13 grid for empty hands', () => {
      const hands: Record<string, ActionType> = {};
      const result = generateRangeGrid(hands);
      expect(result.length).toBe(13);
      expect(result[0].length).toBe(13);
      // generateRangeGrid defaults missing hands to 'fold'
      expect(result[0][0].action).toBe('fold');
    });
  });
});
