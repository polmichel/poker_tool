import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { AppShell } from '../AppShell';
import { renderWithProviders } from '../../tests/render';
import { makeMockAuthApi } from '../../tests/mocks';
import { makeUser } from '../../tests/factories';

describe('AppShell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children inside the main content area', async () => {
    const authApi = makeMockAuthApi();
    authApi.me.mockRejectedValue(new Error('anonymous'));

    renderWithProviders(
      <AppShell>
        <div data-testid="child">Child content</div>
      </AppShell>,
      { route: '/', authApi },
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });
  });

  it('shows the Connexion button when anonymous', async () => {
    const authApi = makeMockAuthApi();
    authApi.me.mockRejectedValue(new Error('anonymous'));

    renderWithProviders(
      <AppShell>
        <div>Test</div>
      </AppShell>,
      { route: '/', authApi },
    );

    await waitFor(() => {
      expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
    });
  });

  it('shows the username button and a Déconnexion menu item when authenticated', async () => {
    localStorage.setItem('poker_tool_token', 'valid-token');
    const user = makeUser({ username: 'testuser' });
    const authApi = makeMockAuthApi();
    authApi.me.mockResolvedValue(user);

    renderWithProviders(
      <AppShell>
        <div>Test</div>
      </AppShell>,
      { route: '/', authApi },
    );

    // The username button appears once authenticated.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /testuser/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/Connexion/i)).not.toBeInTheDocument();

    // Open the user menu and verify the logout item is present.
    fireEvent.click(screen.getByRole('button', { name: /testuser/i }));
    await waitFor(() => {
      expect(screen.getByText(/Deconnexion/i)).toBeInTheDocument();
    });
  });

  it('derives the module title from the route', async () => {
    const authApi = makeMockAuthApi();
    authApi.me.mockRejectedValue(new Error('anonymous'));

    renderWithProviders(
      <AppShell>
        <div>Test</div>
      </AppShell>,
      { route: '/training', authApi },
    );

    // The TopAppBar shows the active module's title for /training.
    await waitFor(() => {
      expect(screen.getByText(/Simulateur/i)).toBeInTheDocument();
    });
  });
});
