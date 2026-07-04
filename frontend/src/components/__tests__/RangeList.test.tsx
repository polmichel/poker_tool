import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RangeList from '../RangeList';
import { Range, RangeType, Position } from '../../types';

// Mock des constantes
jest.mock('../../utils/constants', () => ({
  RANGE_TYPES: {
    preflop: 'Préflop',
    postflop: 'Postflop',
    push_fold: 'Push/Fold',
  },
  POSITIONS: {
    UTG: 'UTG',
    MP: 'MP',
    CO: 'CO',
    BTN: 'BTN',
    SB: 'SB',
    BB: 'BB',
    undefined: 'Non défini',
  },
  ACTION_LABELS: {
    open: 'Ouvrir',
    raise: 'Relancer',
    call: 'Suivre',
    fold: 'Passer',
    all_in: 'Tout miser',
    undefined: 'Non défini',
  },
  ACTION_COLORS: {
    open: '#4CAF50',
    raise: '#2196F3',
    call: '#FF9800',
    fold: '#F44336',
    all_in: '#9C27B0',
    undefined: '#607D8B',
  },
}));

describe('RangeList Component', () => {
  const mockRanges: Range[] = [
    {
      id: 1,
      name: 'UTG Open Range',
      description: 'Range d\'ouverture UTG',
      range_type: 'preflop' as RangeType,
      position: 'UTG' as Position,
      hands: { AA: 'open', KK: 'open', QQ: 'open' },
      user_id: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 2,
      name: 'BTN Open Range',
      description: 'Range d\'ouverture BTN',
      range_type: 'preflop' as RangeType,
      position: 'BTN' as Position,
      hands: { AA: 'open', KK: 'open', QQ: 'open', JJ: 'open' },
      user_id: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ];

  const mockOnSelectRange = jest.fn();
  const mockOnEditRange = jest.fn();
  const mockOnDeleteRange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <RangeList
        ranges={mockRanges}
        onSelectRange={mockOnSelectRange}
        onEditRange={mockOnEditRange}
        onDeleteRange={mockOnDeleteRange}
      />
    );
    expect(screen.getByText('UTG Open Range')).toBeInTheDocument();
    expect(screen.getByText('BTN Open Range')).toBeInTheDocument();
  });

  it('displays all ranges', () => {
    render(
      <RangeList
        ranges={mockRanges}
        onSelectRange={mockOnSelectRange}
        onEditRange={mockOnEditRange}
        onDeleteRange={mockOnDeleteRange}
      />
    );
    expect(screen.getByText('UTG Open Range')).toBeInTheDocument();
    expect(screen.getByText('BTN Open Range')).toBeInTheDocument();
  });

  it('calls onSelectRange when a range is clicked', () => {
    render(
      <RangeList
        ranges={mockRanges}
        onSelectRange={mockOnSelectRange}
        onEditRange={mockOnEditRange}
        onDeleteRange={mockOnDeleteRange}
      />
    );
    fireEvent.click(screen.getByText('UTG Open Range'));
    expect(mockOnSelectRange).toHaveBeenCalledWith(mockRanges[0]);
  });

  it('works without onEditRange and onDeleteRange (optional props)', () => {
    render(
      <RangeList
        ranges={mockRanges}
        onSelectRange={mockOnSelectRange}
      />
    );
    expect(screen.getByText('UTG Open Range')).toBeInTheDocument();
  });

  it('displays range information correctly', () => {
    render(
      <RangeList
        ranges={mockRanges}
        onSelectRange={mockOnSelectRange}
        onEditRange={mockOnEditRange}
        onDeleteRange={mockOnDeleteRange}
      />
    );
    expect(screen.getByText('Range d\'ouverture UTG')).toBeInTheDocument();
    expect(screen.getByText('Préflop')).toBeInTheDocument();
    expect(screen.getByText('UTG')).toBeInTheDocument();
  });
});
