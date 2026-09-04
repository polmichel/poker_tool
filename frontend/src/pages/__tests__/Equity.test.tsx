/**
 * Unit tests for the Equity page.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Equity from '../Equity';
import { EquityMissingError } from '../../api';
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
    mockSimulate.mockReset();
    mockReset.mockReset();
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

  it('renders the hero/range inputs and the simulate button (no iterations selector)', () => {
    renderPage();
    expect(screen.getByTestId('equity-hero-input')).toBeInTheDocument();
    expect(screen.getByTestId('equity-range-input')).toBeInTheDocument();
    expect(screen.getByTestId('equity-simulate-button')).toBeInTheDocument();
    // The default flow no longer exposes an iterations selector.
    expect(screen.queryByTestId('equity-iterations-input')).toBeNull();
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

  it('calls simulate without iterations on a plain "Simuler" click', async () => {
    renderPage();
    const heroInput = screen.getByTestId('equity-hero-input') as HTMLInputElement;
    const rangeInput = screen.getByTestId('equity-range-input') as HTMLInputElement;
    fireEvent.change(heroInput, { target: { value: 'AKs' } });
    fireEvent.change(rangeInput, { target: { value: 'QQ+, AKs' } });
    fireEvent.click(screen.getByTestId('equity-simulate-button'));
    await waitFor(() => {
      expect(mockSimulate).toHaveBeenCalledWith('AKs', 'QQ+, AKs', undefined);
    });
  });

  it('opens the Monte-Carlo dialog when the table is incomplete (409)', async () => {
    mockSimulate.mockRejectedValueOnce(new EquityMissingError('Missing hands', ['72o', '32o']));
    renderPage();
    const heroInput = screen.getByTestId('equity-hero-input') as HTMLInputElement;
    const rangeInput = screen.getByTestId('equity-range-input') as HTMLInputElement;
    fireEvent.change(heroInput, { target: { value: 'AKs' } });
    fireEvent.change(rangeInput, { target: { value: '72o, 32o' } });
    fireEvent.click(screen.getByTestId('equity-simulate-button'));

    await waitFor(() => {
      expect(screen.getByTestId('equity-mc-dialog')).toBeInTheDocument();
    });
    expect(screen.getByTestId('equity-mc-missing').textContent).toContain('72o');
    expect(screen.getByTestId('equity-mc-missing').textContent).toContain('32o');
    expect(screen.getByTestId('equity-mc-iterations-input')).toBeInTheDocument();
    expect(screen.getByTestId('equity-mc-run-button')).toBeInTheDocument();
  });

  it('runs Monte-Carlo with the chosen iteration count from the dialog', async () => {
    mockSimulate.mockRejectedValueOnce(new EquityMissingError('Missing hands', ['72o']));
    mockSimulate.mockResolvedValueOnce({
      hero: 'AKs',
      win: 50,
      tie: 0,
      lose: 50,
      iterations: 2000,
      by_hand: [],
    });
    renderPage();
    fireEvent.change(screen.getByTestId('equity-hero-input'), { target: { value: 'AKs' } });
    fireEvent.change(screen.getByTestId('equity-range-input'), { target: { value: '72o' } });
    fireEvent.click(screen.getByTestId('equity-simulate-button'));

    await waitFor(() => {
      expect(screen.getByTestId('equity-mc-dialog')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByTestId('equity-mc-iterations-input'), {
      target: { value: '2000' },
    });
    fireEvent.click(screen.getByTestId('equity-mc-run-button'));

    await waitFor(() => {
      expect(mockSimulate).toHaveBeenNthCalledWith(2, 'AKs', '72o', 2000);
    });
  });
});
