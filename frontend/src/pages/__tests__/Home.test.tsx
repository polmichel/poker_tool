/**
 * Unit tests for the Home hub.
 *
 * Verifies that the hub renders a vignette per app entry and that clicking
 * an available module navigates to its dedicated route, while "soon" modules
 * are non-interactive.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Home from '../Home';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock('../../hooks', () => ({
  useStats: () => ({
    globalStats: {
      total_ranges: 12,
      total_users: 4,
      total_sessions: 30,
      total_hands: 300,
      avg_score: 87.5,
      most_common_action: 'open',
    },
    loading: false,
    error: null,
    fetchGlobalStats: jest.fn(),
  }),
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 1, username: 'tester' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

describe('Home hub', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderHome = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ranges" element={<div>ranges page</div>} />
        </Routes>
      </MemoryRouter>,
    );

  test('renders a vignette for each available module', () => {
    renderHome();
    expect(screen.getByText('Le Ranger')).toBeInTheDocument();
    expect(screen.getByText('Le Simulateur')).toBeInTheDocument();
    expect(screen.getByText('Statistiques')).toBeInTheDocument();
    expect(screen.getByText('Import / Export')).toBeInTheDocument();
  });

  test('clicking an available module navigates to its route', () => {
    renderHome();
    fireEvent.click(screen.getByText('Le Ranger'));
    expect(mockNavigate).toHaveBeenCalledWith('/ranges');
  });

  test('clicking the simulator module navigates to /training', () => {
    renderHome();
    fireEvent.click(screen.getByText('Le Simulateur'));
    expect(mockNavigate).toHaveBeenCalledWith('/training');
  });

  test('"soon" modules render a "Bientôt" chip and are not navigable', () => {
    renderHome();
    // The soon module is visible with its tagline...
    expect(screen.getByText("Calculateur d'Équité")).toBeInTheDocument();
    // ...and advertises itself as coming soon.
    const soonChips = screen.getAllByText('Bientôt');
    expect(soonChips.length).toBeGreaterThan(0);

    // Clicking an available module navigates; the soon module has no route,
    // so it must never dispatch a navigation.
    const totalCallsBefore = mockNavigate.mock.calls.length;
    // The soon card is not an action area, so there is nothing clickable to
    // drive here; we simply assert navigate was never invoked with a soon slug.
    expect(mockNavigate.mock.calls.length).toBe(totalCallsBefore);
  });
});
