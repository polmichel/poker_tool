import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { Routes, Route } from 'react-router';
import { ProtectedRoute } from '../ProtectedRoute';
import { renderWithProviders } from '../../tests/render';
import { makeMockAuthApi } from '../../tests/mocks';
import { makeUser } from '../../tests/factories';

function renderRoutes(route = '/protected', authApi = makeMockAuthApi()) {
  const utils = renderWithProviders(
    <Routes>
      <Route path="/login" element={<div data-testid="login">Login</div>} />
      <Route
        path="/protected"
        element={
          <ProtectedRoute>
            <div data-testid="protected">Protected</div>
          </ProtectedRoute>
        }
      />
    </Routes>,
    { route, authApi },
  );
  return { ...utils, authApi };
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders a loading state while auth is initializing', () => {
    // No token stored + me() pending: the route shows the loading fallback.
    const authApi = makeMockAuthApi();
    authApi.me.mockReturnValue(new Promise(() => {})); // never resolves
    renderRoutes('/protected', authApi);
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', async () => {
    // No stored token -> fetchCurrentUser resolves anonymously.
    const authApi = makeMockAuthApi();
    authApi.me.mockRejectedValue(new Error('no token'));
    renderRoutes('/protected', authApi);

    await waitFor(() => {
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', async () => {
    localStorage.setItem('poker_tool_token', 'valid-token');
    const authApi = makeMockAuthApi();
    authApi.me.mockResolvedValue(makeUser());

    renderRoutes('/protected', authApi);

    await waitFor(() => {
      expect(screen.getByTestId('protected')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('login')).not.toBeInTheDocument();
  });
});
