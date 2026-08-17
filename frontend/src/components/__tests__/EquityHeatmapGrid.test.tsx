/**
 * Unit tests for the EquityHeatmapGrid component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import EquityHeatmapGrid from '../EquityHeatmapGrid';
import { EquityByHand } from '../../types';

describe('EquityHeatmapGrid', () => {
  const byHand: EquityByHand[] = [
    { hand: 'AKs', combos: 4, win: 46.5, tie: 1.0, lose: 52.5 },
    { hand: 'QQ', combos: 6, win: 18.0, tie: 0.5, lose: 81.5 },
  ];

  it('renders all 169 grid cells', () => {
    render(<EquityHeatmapGrid byHand={byHand} />);
    // 13x13 = 169 cells, each with a data-testid prefix.
    const cells = screen.getAllByTestId(/^equity-cell-/);
    expect(cells).toHaveLength(169);
  });

  it('renders the hand labels for range hands', () => {
    render(<EquityHeatmapGrid byHand={byHand} />);
    expect(screen.getByTestId('equity-cell-AKs')).toHaveTextContent('AKs');
    expect(screen.getByTestId('equity-cell-QQ')).toHaveTextContent('QQ');
  });

  it('renders empty cells for hands outside the range', () => {
    render(<EquityHeatmapGrid byHand={byHand} />);
    const emptyCell = screen.getByTestId('equity-cell-72o');
    expect(emptyCell).toHaveTextContent('72o');
  });

  it('renders nothing when by_hand is empty but still shows the grid', () => {
    render(<EquityHeatmapGrid byHand={[]} />);
    expect(screen.getAllByTestId(/^equity-cell-/)).toHaveLength(169);
  });
});
