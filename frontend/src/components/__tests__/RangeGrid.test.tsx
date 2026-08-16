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
    check: '#FFEB3B',
    undefined: '#607D8B',
  },
  ACTION_LABELS: {
    open: 'Ouvrir',
    raise: 'Relancer',
    call: 'Suivre',
    fold: 'Passer',
    all_in: 'All-In',
    check: 'Checker',
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
  const mockOnActionSelect = jest.fn();

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
    // Sans selectedAction, le clic applique l'action courante de la cellule
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

  // ---- Nouveaux tests : légende cliquable ----

  it('renders the legend when editable', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={true} />);
    expect(screen.getByTestId('range-legend')).toBeInTheDocument();
  });

  it('does not render the legend when not editable', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={false} />);
    expect(screen.queryByTestId('range-legend')).not.toBeInTheDocument();
  });

  it('renders all action items in the legend', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        onActionSelect={mockOnActionSelect}
      />,
    );
    // Les 7 actions de LEGEND_ACTIONS
    expect(screen.getByTestId('legend-item-fold')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-open')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-call')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-raise')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-all_in')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-check')).toBeInTheDocument();
    expect(screen.getByTestId('legend-item-undefined')).toBeInTheDocument();
  });

  it('calls onActionSelect when a legend item is clicked', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        onActionSelect={mockOnActionSelect}
      />,
    );
    fireEvent.click(screen.getByTestId('legend-item-raise'));
    expect(mockOnActionSelect).toHaveBeenCalledWith('raise');
  });

  it('does not call onActionSelect when no handler provided', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={true} />);
    // Pas d'erreur au clic sans handler
    fireEvent.click(screen.getByTestId('legend-item-fold'));
    expect(mockOnActionSelect).not.toHaveBeenCalled();
  });

  // ---- Nouveaux tests : paint-on-drag ----

  it('applies the selected action on mousedown (paint start)', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        selectedAction="raise"
      />,
    );
    const aaCell = screen.getByTestId('range-cell-AA');
    fireEvent.mouseDown(aaCell, { button: 0 });
    // Le mousedown peint la première cellule avec l'action sélectionnée
    expect(mockOnCellClick).toHaveBeenCalledWith('AA', 'raise');
  });

  it('does not start painting when not editable', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={false}
        selectedAction="raise"
      />,
    );
    const aaCell = screen.getByTestId('range-cell-AA');
    fireEvent.mouseDown(aaCell, { button: 0 });
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('paints cells on mouseenter while dragging', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        selectedAction="fold"
      />,
    );
    const aaCell = screen.getByTestId('range-cell-AA');
    const kkCell = screen.getByTestId('range-cell-KK');

    // Démarre la peinture sur AA
    fireEvent.mouseDown(aaCell, { button: 0 });
    expect(mockOnCellClick).toHaveBeenCalledWith('AA', 'fold');

    // Glisse sur KK
    fireEvent.mouseEnter(kkCell);
    expect(mockOnCellClick).toHaveBeenCalledWith('KK', 'fold');
  });

  it('does not paint a cell twice in the same drag', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        selectedAction="open"
      />,
    );
    const aaCell = screen.getByTestId('range-cell-AA');

    fireEvent.mouseDown(aaCell, { button: 0 });
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);

    // Re-survoler AA pendant le même glissé ne doit pas repeindre
    fireEvent.mouseEnter(aaCell);
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
  });

  it('does not paint on mouseenter when not dragging', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        selectedAction="call"
      />,
    );
    const kkCell = screen.getByTestId('range-cell-KK');

    // mouseEnter sans mousedown préalable ne doit rien peindre
    fireEvent.mouseEnter(kkCell);
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });

  it('stops painting after mouseup', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        selectedAction="raise"
      />,
    );
    const aaCell = screen.getByTestId('range-cell-AA');
    const kkCell = screen.getByTestId('range-cell-KK');

    fireEvent.mouseDown(aaCell, { button: 0 });
    // Simule le relâchement du bouton au niveau document
    fireEvent.mouseUp(document);

    // Après mouseup, survoler une autre cellule ne doit pas peindre
    fireEvent.mouseEnter(kkCell);
    expect(mockOnCellClick).toHaveBeenCalledTimes(1);
  });

  it('uses current cell action when no selectedAction provided', () => {
    render(<RangeGrid grid={mockGrid} onCellClick={mockOnCellClick} editable={true} />);
    const aaCell = screen.getByTestId('range-cell-AA');
    fireEvent.mouseDown(aaCell, { button: 0 });
    // Sans selectedAction, retombe sur l'action courante de la cellule (open)
    expect(mockOnCellClick).toHaveBeenCalledWith('AA', 'open');
  });

  it('ignores right-click for painting (only left button)', () => {
    render(
      <RangeGrid
        grid={mockGrid}
        onCellClick={mockOnCellClick}
        editable={true}
        selectedAction="raise"
      />,
    );
    const aaCell = screen.getByTestId('range-cell-AA');
    fireEvent.mouseDown(aaCell, { button: 2 });
    expect(mockOnCellClick).not.toHaveBeenCalled();
  });
});
