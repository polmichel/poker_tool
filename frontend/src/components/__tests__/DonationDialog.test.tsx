/**
 * Unit tests for the DonationDialog component.
 *
 * Verifies that the donation dialog renders correctly, handles amount selection,
 * custom amount input, and submission with Stripe integration.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DonationDialog from '../DonationDialog';

// Mock window.open
const mockWindowOpen = jest.fn();

// Mock fetch
const mockFetch = jest.fn();

beforeAll(() => {
  Object.defineProperty(window, 'open', {
    writable: true,
    value: mockWindowOpen,
  });
  global.fetch = mockFetch;
  // Mock Stripe on window
  window.Stripe = jest.fn().mockImplementation(() => ({
    redirectToCheckout: jest.fn().mockResolvedValue({ error: null }),
  }));
});

beforeEach(() => {
  mockWindowOpen.mockClear();
  mockFetch.mockClear();
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';
  process.env.REACT_APP_API_URL = 'http://localhost:5000';
});

// Mock MUI icons
jest.mock('@mui/icons-material/Close', () => () => <span>Close</span>);
jest.mock('@mui/icons-material/Euro', () => () => <span>Euro</span>);

describe('DonationDialog', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('renders donation dialog when open', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByText(/Soutenir le d.*veloppeur/i)).toBeInTheDocument();
    expect(screen.getByText(/Merci pour votre soutien/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    render(<DonationDialog open={false} onClose={mockOnClose} />);
    expect(screen.queryByText(/Soutenir le d.*veloppeur/i)).not.toBeInTheDocument();
  });

  test('renders predefined amount buttons', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByText('1 €')).toBeInTheDocument();
    expect(screen.getByText('2 €')).toBeInTheDocument();
    expect(screen.getByText('5 €')).toBeInTheDocument();
  });

  test('renders custom amount input', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    expect(screen.getByPlaceholderText(/Montant personnalis./i)).toBeInTheDocument();
  });

  test('selecting a predefined amount displays it', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    // Use getAllByText and click the first one (the button)
    const buttons = screen.getAllByText('2 €');
    fireEvent.click(buttons[0]);
    expect(screen.getByText(/Montant s.*lectionn./i)).toBeInTheDocument();
  });

  test('entering custom amount displays it', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText(/Montant personnalis./i);
    fireEvent.change(input, { target: { value: '10' } });
    expect(screen.getByText(/Montant s.*lectionn./i)).toBeInTheDocument();
    expect(screen.getByText('10 €')).toBeInTheDocument();
  });

  test('custom amount only accepts numbers', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText(/Montant personnalis./i);

    // Should accept numbers
    fireEvent.change(input, { target: { value: '15.50' } });
    expect(input).toHaveValue('15.50');

    // Should reject letters
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input).not.toHaveValue('abc');
  });

  test('cancel button calls onClose', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText('Annuler'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('submit button is disabled when no amount selected', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    const submitButton = screen.getByText('Faire un don');
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when amount selected', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    // Use getAllByText and take the first button
    const buttons = screen.getAllByText('1 €');
    fireEvent.click(buttons[0]);
    const submitButton = screen.getByText('Faire un don');
    expect(submitButton).not.toBeDisabled();
  });

  test('submit button is enabled when custom amount entered', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText(/Montant personnalis./i);
    fireEvent.change(input, { target: { value: '10' } });
    const submitButton = screen.getByText('Faire un don');
    expect(submitButton).not.toBeDisabled();
  });

  test('submitting with predefined amount calls fetch and redirects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'cs_test_123' }),
    });

    render(<DonationDialog open={true} onClose={mockOnClose} />);
    // Click the 5 € button (first one to avoid duplicates)
    const buttons = screen.getAllByText('5 €');
    fireEvent.click(buttons[0]);
    fireEvent.click(screen.getByText('Faire un don'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/donations/create-checkout-session',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 5, currency: 'eur' }),
        }),
      );
    });
  });

  test('submitting with custom amount calls fetch and redirects', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'cs_test_456' }),
    });

    render(<DonationDialog open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText(/Montant personnalis./i);
    fireEvent.change(input, { target: { value: '15.50' } });
    fireEvent.click(screen.getByText('Faire un don'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/donations/create-checkout-session',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 15.5, currency: 'eur' }),
        }),
      );
    });
  });

  test('submitting with zero amount does nothing', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    const input = screen.getByPlaceholderText(/Montant personnalis./i);
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(screen.getByText('Faire un don'));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('closing dialog calls onClose', () => {
    render(<DonationDialog open={true} onClose={mockOnClose} />);
    // Click the close button (icon)
    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
