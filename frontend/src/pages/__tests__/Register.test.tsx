/**
 * Unit tests for the Register page component.
 *
 * Tests the form validation and the interaction with useAuth's register
 * function (mocked).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from '../Register';

// Mock useAuth so we can control register's behavior
const mockRegister = jest.fn();
const mockUseAuth = jest.fn(() => ({
  register: mockRegister,
  loading: false,
  error: null,
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuthContext: () => mockUseAuth(),
}));

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );

describe('Register page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ register: mockRegister, loading: false, error: null });
  });

  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByTestId('register-username')).toBeInTheDocument();
    expect(screen.getByTestId('register-email')).toBeInTheDocument();
    expect(screen.getByTestId('register-password')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit')).toBeInTheDocument();
  });

  it('shows validation error when fields are empty', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('obligatoire');
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('shows error for short password', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.type(screen.getByTestId('register-username'), 'testuser');
    await user.type(screen.getByTestId('register-email'), 'test@test.com');
    await user.type(screen.getByTestId('register-password'), 'short');
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('6 caract');
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register with form values', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue({ id: 1, username: 'testuser' });
    renderRegister();

    await user.type(screen.getByTestId('register-username'), 'testuser');
    await user.type(screen.getByTestId('register-email'), 'test@test.com');
    await user.type(screen.getByTestId('register-password'), 'password123');
    await user.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@test.com', 'password123');
    });
  });

  it('displays auth error from the hook', () => {
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      loading: false,
      error: 'Username already exists' as any,
    });
    renderRegister();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Username already exists');
  });

  it('disables submit button while loading', () => {
    mockUseAuth.mockReturnValue({
      register: mockRegister,
      loading: true,
      error: null,
    });
    renderRegister();

    const submit = screen.getByTestId('register-submit') as HTMLButtonElement;
    expect(submit).toBeDisabled();
    expect(submit).toHaveTextContent('Inscription');
  });
});
