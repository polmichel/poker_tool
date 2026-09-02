/**
 * Unit tests for the Ranges page component.
 * Tests the new folder-based range management functionality.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Ranges from '../Ranges';

// Mock useRanges hook
const mockFetchRanges = jest.fn();
const mockCreateRange = jest.fn();
const mockUpdateRange = jest.fn();
const mockDeleteRange = jest.fn();
const mockImportRange = jest.fn();
const mockExportRange = jest.fn();

const mockRanges = [
  {
    id: 1,
    name: 'UTG Range',
    description: 'Opening range from UTG',
    range_type: 'preflop' as const,
    position: 'UTG' as const,
    hands: { AA: 'open', KK: 'open', AKs: 'open' },
  },
  {
    id: 2,
    name: 'BTN Range',
    description: 'Opening range from BTN',
    range_type: 'preflop' as const,
    position: 'BTN' as const,
    hands: { AA: 'open', KK: 'open', QQ: 'open', AKs: 'open', AQs: 'open' },
  },
];

const mockSetSelectedRange = jest.fn();

const mockUseRanges = jest.fn(() => ({
  ranges: mockRanges,
  loading: false,
  error: null,
  selectedRange: null,
  setSelectedRange: mockSetSelectedRange,
  fetchRanges: mockFetchRanges,
  createRange: mockCreateRange,
  updateRange: mockUpdateRange,
  deleteRange: mockDeleteRange,
  importRange: mockImportRange,
  exportRange: mockExportRange,
}));

jest.mock('../../hooks/useRanges', () => ({
  useRanges: () => mockUseRanges(),
}));

// Mock generateRangeGrid
jest.mock('../../utils/helpers', () => ({
  generateRangeGrid: jest.fn(() => []),
}));

// Mock THEME_COLORS
jest.mock('../../utils/constants', () => ({
  THEME_COLORS: {
    paperElevated: '#1a1a1a',
    paper: '#121212',
    border: '#333',
    borderStrong: '#444',
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#10b981',
    secondary: '#22d3ee',
    secondaryDark: '#06b6d4',
    background: '#0a0a0a',
    backgroundGradient: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    success: '#4caf50',
  },
}));

const renderRanges = () =>
  render(
    <MemoryRouter>
      <Ranges />
    </MemoryRouter>,
  );

describe('Ranges page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRanges.mockReturnValue({
      ranges: mockRanges,
      loading: false,
      error: null,
      selectedRange: null,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      createRange: mockCreateRange,
      updateRange: mockUpdateRange,
      deleteRange: mockDeleteRange,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
  });

  it('renders without crashing', () => {
    renderRanges();
    expect(screen.getByText('Gestion des Ranges')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseRanges.mockReturnValue({
      ranges: [],
      loading: true,
      error: null,
      selectedRange: null,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      createRange: mockCreateRange,
      updateRange: mockUpdateRange,
      deleteRange: mockDeleteRange,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
    renderRanges();
    expect(screen.getByText('Chargement des ranges...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseRanges.mockReturnValue({
      ranges: [],
      loading: false,
      error: 'Failed to load ranges',
      selectedRange: null,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      createRange: mockCreateRange,
      updateRange: mockUpdateRange,
      deleteRange: mockDeleteRange,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
    renderRanges();
    expect(screen.getByText('Failed to load ranges')).toBeInTheDocument();
  });

  it('displays folder tree with root folder', () => {
    renderRanges();
    expect(screen.getByText('Dossiers')).toBeInTheDocument();
    expect(screen.getByText('Toutes les Ranges')).toBeInTheDocument();
  });

  it('displays range list', () => {
    renderRanges();
    expect(screen.getByText('Ranges (2)')).toBeInTheDocument();
    expect(screen.getByText('UTG Range')).toBeInTheDocument();
    expect(screen.getByText('BTN Range')).toBeInTheDocument();
  });

  it('displays search input', () => {
    renderRanges();
    const searchInput = screen.getByPlaceholderText('Rechercher une range...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays new range button', () => {
    renderRanges();
    expect(screen.getByTestId('new-range-button')).toBeInTheDocument();
  });

  it('displays new folder button', () => {
    renderRanges();
    expect(screen.getByText('Nouveau Dossier')).toBeInTheDocument();
  });

  it('displays refresh button', () => {
    renderRanges();
    const refreshButtons = screen.getAllByRole('button', { name: /actualiser/i });
    expect(refreshButtons.length).toBeGreaterThan(0);
  });

  it('displays import/export button', () => {
    renderRanges();
    expect(screen.getByText('Importer/Exporter')).toBeInTheDocument();
  });

  it('filters ranges based on search query', async () => {
    const user = userEvent.setup();
    renderRanges();

    const searchInput = screen.getByPlaceholderText('Rechercher une range...');
    await user.type(searchInput, 'UTG');

    // Should only show UTG Range
    expect(screen.getByText('UTG Range')).toBeInTheDocument();
    expect(screen.queryByText('BTN Range')).not.toBeInTheDocument();
  });

  it('shows message when no range is selected', () => {
    renderRanges();
    expect(screen.getByText('Sélectionnez une range pour voir ses détails')).toBeInTheDocument();
  });

  it('calls fetchRanges on mount', () => {
    renderRanges();
    expect(mockFetchRanges).toHaveBeenCalled();
  });

  it('calls fetchRanges when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderRanges();

    const refreshButtons = screen.getAllByRole('button', { name: /actualiser/i });
    await user.click(refreshButtons[0]);

    expect(mockFetchRanges).toHaveBeenCalledTimes(2);
  });

  it('displays range count correctly', () => {
    renderRanges();
    expect(screen.getByText(/Ranges \(2\)/)).toBeInTheDocument();
  });

  it('displays range type and position information', () => {
    renderRanges();
    // The range info is displayed in the list items
    const rangeItems = screen.getAllByText(/preflop/);
    expect(rangeItems.length).toBeGreaterThan(0);
  });
});
