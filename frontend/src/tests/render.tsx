/**
 * Test render helpers
 *
 * Wraps components with the same providers the app uses (theme, auth,
 * focus-mode, router) so component tests run with the context they
 * expect. Supports injecting a fake AuthApi so the AuthProvider's
 * initial `me()` call does not hit the network.
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { MemoryRouter } from 'react-router-dom';
import { darkTheme } from '../app/theme';
import { AuthProvider } from '../auth/AuthContext';
import { FocusModeProvider } from '../contexts/FocusModeContext';
import { AuthApi } from '../api';

export interface RenderWithProvidersOptions extends RenderOptions {
  route?: string;
  authApi?: AuthApi;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { route = '/', authApi, ...renderOptions }: RenderWithProvidersOptions = {},
) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider theme={darkTheme}>
      <AuthProvider authApi={authApi}>
        <FocusModeProvider>
          <MemoryRouter
            initialEntries={[route]}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            {children}
          </MemoryRouter>
        </FocusModeProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}
