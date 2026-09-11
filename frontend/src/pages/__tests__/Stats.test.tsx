/**
 * Unit tests for the Stats page.
 *
 * Mocks useStats + useFocusMode so the page renders without a network layer
 * and without chart data fetches. Asserts the overview tab renders global
 * stats cards and that tabs switch between overview/history/leaderboard.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Stats from '../Stats';
import { makeGlobalStats } from '../../tests/factories';

const mockFetchGlobalStats = jest.fn();
const mockFetchTrainingHistory = jest.fn();
const mockFetchLeaderboard = jest.fn();
const mockExportStats = jest.fn();

const mockUseStats = jest.fn();

vi.mock('../../hooks/useStats', () => ({
  useStats: () => mockUseStats(),
}));

vi.mock('../../contexts/FocusModeContext', () => ({
  useFocusMode: () => ({ setFocusMode: jest.fn(), focusMode: false }),
}));

vi.mock('../../components', () => ({
  StatsCard: ({ title, stats }: any) => (
    <div data-testid="stats-card">
      <span data-testid="stats-card-title">{title}</span>
      <span data-testid="stats-card-values">{JSON.stringify(stats)}</span>
    </div>
  ),
}));

const renderStats = () =>
  render(
    <MemoryRouter>
      <Stats />
    </MemoryRouter>,
  );

describe('Stats page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchGlobalStats.mockResolvedValue(makeGlobalStats());
    mockFetchTrainingHistory.mockResolvedValue([]);
    mockFetchLeaderboard.mockResolvedValue([]);
    mockExportStats.mockResolvedValue({ exported: true });
    mockUseStats.mockReturnValue({
      globalStats: makeGlobalStats(),
      userStats: null,
      loading: false,
      error: null,
      fetchGlobalStats: mockFetchGlobalStats,
      fetchUserStats: jest.fn(),
      fetchTrainingHistory: mockFetchTrainingHistory,
      fetchLeaderboard: mockFetchLeaderboard,
      exportStats: mockExportStats,
    });
  });

  it('renders the page title and the three tabs', async () => {
    renderStats();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Statistiques/ })).toBeInTheDocument();
    });
    expect(screen.getByRole('tab', { name: /Aperçu/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Historique/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Classement/ })).toBeInTheDocument();
  });

  it('renders the overview stats cards on the default tab', async () => {
    renderStats();
    await waitFor(() => {
      expect(screen.getAllByTestId('stats-card').length).toBeGreaterThanOrEqual(4);
    });
    const titles = screen.getAllByTestId('stats-card-title').map((el) => el.textContent);
    expect(titles).toContain('Ranges');
    expect(titles).toContain('Sessions');
  });

  it('shows a loading message while loading', async () => {
    mockUseStats.mockReturnValue({
      globalStats: null,
      userStats: null,
      loading: true,
      error: null,
      fetchGlobalStats: mockFetchGlobalStats,
      fetchUserStats: jest.fn(),
      fetchTrainingHistory: mockFetchTrainingHistory,
      fetchLeaderboard: mockFetchLeaderboard,
      exportStats: mockExportStats,
    });
    renderStats();
    await waitFor(() => {
      expect(screen.getByText(/Chargement des statistiques/i)).toBeInTheDocument();
    });
  });

  it('shows an error message when the hook reports an error', async () => {
    mockUseStats.mockReturnValue({
      globalStats: null,
      userStats: null,
      loading: false,
      error: 'Erreur réseau',
      fetchGlobalStats: mockFetchGlobalStats,
      fetchUserStats: jest.fn(),
      fetchTrainingHistory: mockFetchTrainingHistory,
      fetchLeaderboard: mockFetchLeaderboard,
      exportStats: mockExportStats,
    });
    renderStats();
    await waitFor(() => {
      expect(screen.getByText(/Erreur réseau/)).toBeInTheDocument();
    });
  });

  it('switches to the history tab and shows the empty state', async () => {
    renderStats();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Historique/ }));
    });
    await waitFor(() => {
      expect(screen.getByText(/Aucune session/i)).toBeInTheDocument();
    });
  });

  it('switches to the leaderboard tab and shows the empty state', async () => {
    renderStats();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Classement/ }));
    });
    await waitFor(() => {
      expect(screen.getByText(/Aucun utilisateur/i)).toBeInTheDocument();
    });
  });

  it('renders the history table rows when history data is present', async () => {
    const history = [
      {
        id: 1,
        created_at: '2024-01-01T00:00:00Z',
        range: { name: 'UTG' },
        mode: 'fill',
        score: 85,
        correct_answers: 8,
        total_questions: 10,
        time_spent: 120,
      },
    ];
    mockFetchTrainingHistory.mockResolvedValue(history);
    mockUseStats.mockReturnValue({
      globalStats: makeGlobalStats(),
      userStats: null,
      loading: false,
      error: null,
      fetchGlobalStats: mockFetchGlobalStats,
      fetchUserStats: jest.fn(),
      fetchTrainingHistory: mockFetchTrainingHistory,
      fetchLeaderboard: mockFetchLeaderboard,
      exportStats: mockExportStats,
    });
    renderStats();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Historique/ }));
    });
    await waitFor(() => {
      expect(screen.getByText('UTG')).toBeInTheDocument();
    });
  });

  it('renders leaderboard rows when leaderboard data is present', async () => {
    const board = [
      {
        user: { id: 1, username: 'topplayer' },
        total_sessions: 10,
        avg_score: 90,
        total_time_spent: 600,
      },
    ];
    mockFetchLeaderboard.mockResolvedValue(board);
    mockUseStats.mockReturnValue({
      globalStats: makeGlobalStats(),
      userStats: null,
      loading: false,
      error: null,
      fetchGlobalStats: mockFetchGlobalStats,
      fetchUserStats: jest.fn(),
      fetchTrainingHistory: mockFetchTrainingHistory,
      fetchLeaderboard: mockFetchLeaderboard,
      exportStats: mockExportStats,
    });
    renderStats();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Classement/ }));
    });
    await waitFor(() => {
      expect(screen.getByText('topplayer')).toBeInTheDocument();
    });
  });
});
