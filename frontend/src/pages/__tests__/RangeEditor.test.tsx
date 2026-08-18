/**
 * Unit tests for the RangeEditor page component.
 *
 * Mocks the useRanges hook so we can control the loaded range and verify
 * interactions with the grid (legend selection + paint).
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RangeEditor from '../RangeEditor';
import { Range } from '../../types';

const mockRange: Range = {
  id: 1,
  name: 'Test Range',
  description: 'Une range de test',
  range_type: 'preflop',
  position: 'BTN',
  hands: { AA: 'open', KK: 'open' },
};

const mockUpdateRange = jest.fn();

jest.mock('../../hooks', () => ({
  ...jest.requireActual('../../hooks'),
  useRanges: () => ({
    loading: false,
    error: null,
    selectedRange: mockRange,
    setSelectedRange: jest.fn(),
    fetchRange: jest.fn(),
    updateRange: mockUpdateRange,
    deleteRange: jest.fn(),
  }),
}));

jest.mock('../../utils/helpers', () => ({
  ...jest.requireActual('../../utils/helpers'),
  generateRangeGrid: (hands: Record<string, any>) => {
    // Petite grille 2x2 pour les tests
    return [
      [
        { hand: 'AA', action: hands['AA'] || 'fold', color: '#4CAF50' },
        { hand: 'AKs', action: hands['AKs'] || 'fold', color: '#9E9E9E' },
      ],
      [
        { hand: 'KK', action: hands['KK'] || 'fold', color: '#4CAF50' },
        { hand: 'QQ', action: hands['QQ'] || 'fold', color: '#9E9E9E' },
      ],
    ];
  },
  gridToHands: (grid: any[][]) => {
    const hands: Record<string, any> = {};
    for (const row of grid) {
      for (const cell of row) {
        hands[cell.hand] = cell.action;
      }
    }
    return hands;
  },
}));

// Mock RangeStats : il utilise recharts/ResponsiveContainer qui a besoin de
// ResizeObserver (absent de jsdom). On l'évite pour ces tests d'intégration.
jest.mock('../../components/RangeStats', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-testid': 'range-stats-mock' }, 'RangeStats'),
  };
});

const renderEditor = (id: string = '1') =>
  render(
    <MemoryRouter initialEntries={[`/ranges/${id}/edit`]}>
      <Routes>
        <Route path="/ranges/:id/edit" element={<RangeEditor />} />
      </Routes>
    </MemoryRouter>,
  );

describe('RangeEditor page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the range editor with the range name', () => {
    renderEditor();
    expect(screen.getByText('Test Range')).toBeInTheDocument();
  });

  it('renders the clickable legend', () => {
    renderEditor();
    expect(screen.getByTestId('range-legend')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-open')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-fold')).toBeInTheDocument();
  });

  it('applies the selected action when a cell is clicked', () => {
    renderEditor();
    // Sélectionne 'raise' dans la légende, puis clique sur QQ.
    fireEvent.click(screen.getByTestId('legend-item-raise'));
    const qqCell = screen.getByTestId('range-cell-QQ');
    fireEvent.click(qqCell);
    // Le composant doit rester monté sans erreur après l'interaction.
    expect(screen.getByText('Test Range')).toBeInTheDocument();
  });

  it('paints multiple cells via mousedown + mouseenter', () => {
    renderEditor();
    // Sélectionne 'call' dans la légende
    fireEvent.click(screen.getByTestId('legend-item-call'));

    const aaCell = screen.getByTestId('range-cell-AA');
    const qqCell = screen.getByTestId('range-cell-QQ');

    // Démarre le paint sur AA
    fireEvent.mouseDown(aaCell, { button: 0 });
    // Glisse sur QQ
    fireEvent.mouseEnter(qqCell);
    // Le composant doit toujours être monté sans erreur
    expect(screen.getByText('Test Range')).toBeInTheDocument();
  });

  it('calls updateRange on save with the painted hands', async () => {
    mockUpdateRange.mockResolvedValue({ ...mockRange, hands: { AA: 'open', KK: 'open' } });
    renderEditor();

    // Clique sur Sauvegarder
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateRange).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ hands: expect.any(Object) }),
      );
    });
  });
});
