/**
 * Unit tests for the Equity page.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Equity from '../Equity';
import { EquityResult } from '../../types';

const mockSimulate = jest.fn();
const mockReset = jest.fn();

jest.mock('../../hooks', () => ({
  useEquity: () => ({
    result: null as EquityResult | null,
    loading: false,
    error: null,
    simulate: mockSimulate,
    reset: mockReset,
  }),
}));

jest.mock('../../auth/AuthContext', () => ({
  useAuthContext: () => ({
    user: { id: 1, username: 'tester' },
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}));

describe('Equity page', () => {
  beforeEach(() => {
    mockSimulate.mockClear();
    mockReset.mockClear();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <Equity />
      </MemoryRouter>,
    );

  it('renders the page title and empty state', () => {
    renderPage();
    expect(screen.getByText("Calculateur d'Équité")).toBeInTheDocument();
    expect(screen.getByText('Prêt à calculer une équité ?')).toBeInTheDocument();
  });

  it('renders the configuration inputs', () => {
    renderPage();
    expect(screen.getByTestId('equity-hero-input')).toBeInTheDocument();
    expect(screen.getByTestId('equity-range-input')).toBeInTheDocument();
    expect(screen.getByTestId('equity-iterations-input')).toBeInTheDocument();
    expect(screen.getByTestId('equity-simulate-button')).toBeInTheDocument();
  });

  it('shows a validation error for an invalid hero hand', async () => {
    renderPage();
    const heroInput = screen.getByTestId('equity-hero-input') as HTMLInputElement;
    fireEvent.change(heroInput, { target: { value: 'ZZ' } });
    fireEvent.click(screen.getByTestId('equity-simulate-button'));

    await waitFor(() => {
      expect(screen.getByTestId('equity-validation-error')).toBeInTheDocument();
    });
    expect(mockSimulate).not.toHaveBeenCalled();
  });

  it('calls simulate with the configured inputs', async () => {
    renderPage();
    const heroInput = screen.getByTestId('equity-hero-input') as HTMLInputElement;
    const rangeInput = screen.getByTestId('equity-range-input') as HTMLInputElement;
    fireEvent.change(heroInput, { target: { value: 'AKs' } });
    fireEvent.change(rangeInput, { target: { value: 'QQ+, AKs' } });
    fireEvent.click(screen.getByTestId('equity-simulate-button'));

    await waitFor(() => {
      expect(mockSimulate).toHaveBeenCalledWith('AKs', 'QQ+, AKs', 5000);
    });
  });
});
