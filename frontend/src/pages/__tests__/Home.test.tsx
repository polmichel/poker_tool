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
          <Route path="/training" element={<div>training page</div>} />
          <Route path="/equity" element={<div>equity page</div>} />
        </Routes>
      </MemoryRouter>,
    );

  test('renders a vignette for each module', () => {
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

  test('clicking the equity module navigates to /equity', () => {
    renderHome();
    fireEvent.click(screen.getByText("Calculateur d'Équité"));
    expect(mockNavigate).toHaveBeenCalledWith('/equity');
  });

  test('"soon" modules render a "Bientôt" chip and are not navigable', () => {
    renderHome();

    // The "soon" modules are visible with their titles...
    expect(screen.getByText('Statistiques')).toBeInTheDocument();
    expect(screen.getByText('Import / Export')).toBeInTheDocument();
    expect(screen.getByText('ICM / Push-Fold')).toBeInTheDocument();

    // ...and each advertises itself as coming soon (one chip per soon card).
    const soonChips = screen.getAllByText('Bientôt');
    expect(soonChips.length).toBe(3);

    // Clicking an available module navigates; the "soon" cards are disabled
    // (no action area), so clicking their titles must not dispatch navigation.
    const callsBefore = mockNavigate.mock.calls.length;
    fireEvent.click(screen.getByText('Statistiques'));
    fireEvent.click(screen.getByText('Import / Export'));
    fireEvent.click(screen.getByText('ICM / Push-Fold'));
    expect(mockNavigate.mock.calls.length).toBe(callsBefore);
  });
});
