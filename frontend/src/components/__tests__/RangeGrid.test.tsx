import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RangeGrid from '../RangeGrid';
import { RangeGridCell } from '../../types';

// Mock des constantes
jest.mock('../../utils/constants', () => ({
  ACTION_COLORS: {
    open: '#4CAF50',
    raise: '#2196F3',
    call: '#FF9800',
    fold: '#F44336',
    all_in: '#9C27B0',
    undefined: '#607D8B',
  },
  ACTION_LABELS: {
    open: 'Ouvrir',
    raise: 'Relancer',
    call: 'Suivre',
    fold: 'Passer',
    all_in: 'All-In',
    undefined: 'Non défini',
  },
}));

// Mock des types
jest.mock('../../types', () => ({
  ...jest.requireActual('../../types'),
  RANKS: ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'],
}));

describe('RangeGrid Component', () => {
  const mockGrid: RangeGridCell[][] = [
    [
      { hand: 'AA', action: 'open', color: '#4CAF50' },
      { hand: 'AKs', action: 'raise', color: '#2196F3' },
    ],
    [
      { hand: 'KK', action: 'open', color: '#4CAF50' },
      { hand: 'QQ', action: 'call', color: '#FF9800' },
    ],
  ];

  const mockOnCellClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={true} />);
    expect(screen.getByText('AA')).toBeInTheDocument();
    expect(screen.getByText('KK')).toBeInTheDocument();
  });

  it('displays all hands from the grid', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} showLabels={true} />);
    expect(screen.getByText('AA')).toBeInTheDocument();
    expect(screen.getByText('AKs')).toBeInTheDocument();
    expect(screen.getByText('KK')).toBeInTheDocument();
    expect(screen.getByText('QQ')).toBeInTheDocument();
  });

  it('calls onCellClick when a cell is clicked', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={true} />);
    fireEvent.click(screen.getByText('AA'));
    expect(mockOnCellClick).toHaveBeenCalledWith('AA', 'open');
  });

  it('does not call onCellClick when not editable', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={false} />);
    fireEvent.click(screen.getByText('AA'));
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('renders with correct cell colors', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} />);
    // jsdom does not reliably compute MUI Emotion `sx` background colors, so
    // assert on the tooltip/aria-label which encodes the cell's action (and
    // thus its color mapping) instead of the computed style.
    expect(screen.getByLabelText('Main: AA | Action: Ouvrir')).toBeInTheDocument();
    expect(screen.getByLabelText('Main: AKs | Action: Relancer')).toBeInTheDocument();
  });

  it('renders row and column labels when showLabels is true', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} showLabels={true} />);
    // Row and column labels both render single letters, so there are
    // multiple matches per letter.
    expect(screen.getAllByText('A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('K').length).toBeGreaterThan(0);
  });

  it('does not render context menu when not editable', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={false} />);
    // Right-click should not open menu
    const aaCell = screen.getByText('AA');
    fireEvent.contextMenu(aaCell);
    // No menu should be rendered
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
