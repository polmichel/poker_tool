/**
 * Unit tests for the Login page component.
 *
 * Tests form interaction and the integration with useAuth's login function
 * (mocked), including navigation on success and validation errors.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../Login';

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockUseAuth = jest.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../auth/AuthContext', () => ({
  useAuthContext: () => mockUseAuth(),
}));

const renderLogin = () =>
  render(
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>home</div>} />
        <Route path="/register" element={<div>register page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('Login page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ login: mockLogin, loading: false, error: null });
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByTestId('login-username')).toBeInTheDocument();
    expect(screen.getByTestId('login-password')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
  });

  it('shows a validation error when fields are empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByTestId('login-submit'));
    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('obligatoire');
    });
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with the form values', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ id: 1, username: 'testuser' });
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'testuser');
    await user.type(screen.getByTestId('login-password'), 'password123');
    await user.click(screen.getByTestId('login-submit'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('navigates to home on successful login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ id: 1, username: 'testuser' });
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'testuser');
    await user.type(screen.getByTestId('login-password'), 'password123');
    await user.click(screen.getByTestId('login-submit'));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('does not navigate when login fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(null);
    renderLogin();
    await user.type(screen.getByTestId('login-username'), 'testuser');
    await user.type(screen.getByTestId('login-password'), 'wrongpass');
    await user.click(screen.getByTestId('login-submit'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'wrongpass');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('displays the auth error from the hook', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: 'Identifiants invalides',
    });
    renderLogin();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Identifiants invalides');
  });

  it('disables the submit button and shows loading text while loading', () => {
    mockUseAuth.mockReturnValue({ login: mockLogin, loading: true, error: null });
    renderLogin();
    const submit = screen.getByTestId('login-submit') as HTMLButtonElement;
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Connexion');
  });

  it('navigates to register when creating an account', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByText(/Créer un compte/i));
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderLogin();
    const passwordInput = screen.getByTestId('login-password') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');
    // The visibility toggle is the unlabelled IconButton in the password
    // field's end adornment; it has no accessible name, so we scope the
    // button via the input adornment container.
    // eslint-disable-next-line testing-library/no-node-access
    const toggleButton = passwordInput.closest('div')?.querySelector('button');
    await user.click(toggleButton as Element);
    expect(passwordInput.type).toBe('text');
  });
});
