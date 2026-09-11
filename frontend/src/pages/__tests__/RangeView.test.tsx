/**
 * Unit tests for the RangeView page.
 *
 * Mocks useRanges (autoFetch=false) so the page renders without a network
 * layer and asserts the loading/error/loaded states, delete confirmation,
 * and navigation actions.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RangeView from '../RangeView';
import { makeRange } from '../../tests/factories';
import type { Range } from '../../types';

const mockNavigate = jest.fn();
const mockFetchRange = jest.fn();
const mockDeleteRange = jest.fn();

const mockUseRanges = jest.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useRanges', () => ({
  useRanges: () => mockUseRanges(),
}));

vi.mock('../../components', () => ({
  RangeGrid: ({ grid }: any) => (
    <div data-testid="range-grid">
      {grid.length}x{grid[0]?.length ?? 0}
    </div>
  ),
  RangeStats: ({ range }: any) => <div data-testid="range-stats">{range.name}</div>,
}));

const mockRange: Range = makeRange({
  id: 1,
  name: 'UTG Range',
  hands: { AA: 'open', AKs: 'open' },
});

const renderRangeView = (route = '/ranges/1') =>
  render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/ranges/:id" element={<RangeView />} />
        <Route path="/ranges" element={<div>ranges list</div>} />
        <Route path="/ranges/1/edit" element={<div>edit page</div>} />
        <Route path="/ranges/new" element={<div>new range page</div>} />
        <Route path="/import-export" element={<div>import-export page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('RangeView page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchRange.mockResolvedValue(mockRange);
    mockDeleteRange.mockResolvedValue(undefined);
  });

  it('shows a loading state while the range is being fetched', () => {
    mockUseRanges.mockReturnValue({
      loading: true,
      error: null as string | null,
      selectedRange: null,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', () => {
    mockUseRanges.mockReturnValue({
      loading: false,
      error: 'Erreur réseau',
      selectedRange: null,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    expect(screen.getByText(/Erreur réseau/)).toBeInTheDocument();
  });

  it('renders the range details once loaded', async () => {
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'UTG Range' })).toBeInTheDocument();
    });
    expect(screen.getByTestId('range-grid')).toBeInTheDocument();
    expect(screen.getByTestId('range-stats')).toBeInTheDocument();
    expect(screen.getByText('Type: preflop')).toBeInTheDocument();
    expect(screen.getByText('Position: BTN')).toBeInTheDocument();
  });

  it('calls fetchRange with the route id on mount', () => {
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView('/ranges/42');
    expect(mockFetchRange).toHaveBeenCalledWith(42);
  });

  it('navigates back to the ranges list when back is clicked', async () => {
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    await screen.findByRole('heading', { name: 'UTG Range' });
    fireEvent.click(screen.getByRole('button', { name: /Retour à la liste/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/ranges');
  });

  it('navigates to the edit page when Modifier is clicked', async () => {
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    await screen.findByRole('heading', { name: 'UTG Range' });
    fireEvent.click(screen.getByRole('button', { name: /Modifier/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/ranges/1/edit');
  });

  it('duplicates the range by navigating to new with state', async () => {
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    await screen.findByRole('heading', { name: 'UTG Range' });
    fireEvent.click(screen.getByRole('button', { name: /Dupliquer/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/ranges/new', {
      state: { duplicateFrom: mockRange },
    });
  });

  it('exports the range by navigating to import-export', async () => {
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    await screen.findByRole('heading', { name: 'UTG Range' });
    fireEvent.click(screen.getByRole('button', { name: /Exporter/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/import-export', { state: { exportRangeId: 1 } });
  });

  it('deletes the range after confirmation and navigates to the list', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    await screen.findByRole('heading', { name: 'UTG Range' });
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/i }));
    await waitFor(() => expect(mockDeleteRange).toHaveBeenCalledWith(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/ranges'));
    confirmSpy.mockRestore();
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    mockUseRanges.mockReturnValue({
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      fetchRange: mockFetchRange,
      deleteRange: mockDeleteRange,
    });
    renderRangeView();
    await screen.findByRole('heading', { name: 'UTG Range' });
    fireEvent.click(screen.getByRole('button', { name: /Supprimer/i }));
    expect(mockDeleteRange).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
