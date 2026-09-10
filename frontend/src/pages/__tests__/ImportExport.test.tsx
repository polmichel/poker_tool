/**
 * Unit tests for the ImportExport page.
 *
 * Mocks useRanges (hooks + FocusMode context) so the page renders without
 * a network layer, and asserts the import/export tab interactions and
 * error/success messaging.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ImportExport from '../ImportExport';
import type { Range } from '../../types';
import { makeRange } from '../../tests/factories';

const mockFetchRanges = jest.fn();
const mockImportRange = jest.fn();
const mockExportRange = jest.fn();
const mockSetSelectedRange = jest.fn();

const mockRange: Range = makeRange({ id: 1, name: 'Export Range' });
const mockRanges: Range[] = [mockRange];

const mockUseRanges = jest.fn(() => ({
  ranges: mockRanges,
  loading: false,
  error: null as string | null,
  selectedRange: null as Range | null,
  setSelectedRange: mockSetSelectedRange,
  fetchRanges: mockFetchRanges,
  importRange: mockImportRange,
  exportRange: mockExportRange,
}));

jest.mock('../../hooks/useRanges', () => ({
  useRanges: () => mockUseRanges(),
}));

jest.mock('../../contexts/FocusModeContext', () => ({
  useFocusMode: () => ({ setFocusMode: jest.fn(), focusMode: false }),
}));

jest.mock('../../components', () => ({
  RangeList: ({ ranges, onSelectRange, selectedRangeId }: any) => (
    <div data-testid="range-list">
      {ranges.map((r: Range) => (
        <button
          key={r.id}
          data-testid={`range-item-${r.id}`}
          onClick={() => onSelectRange(r)}
          aria-pressed={selectedRangeId === r.id}
        >
          {r.name}
        </button>
      ))}
    </div>
  ),
}));

const renderImportExport = () =>
  render(
    <MemoryRouter>
      <ImportExport />
    </MemoryRouter>,
  );

describe('ImportExport page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRanges.mockReturnValue({
      ranges: mockRanges,
      loading: false,
      error: null as string | null,
      selectedRange: null,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
  });

  it('renders the page title and import tab by default', () => {
    renderImportExport();
    expect(screen.getByRole('heading', { name: /Importer\/Exporter/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Importer/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Exporter/ })).toBeInTheDocument();
  });

  it('disables the import button when content is empty', () => {
    renderImportExport();
    const importButton = screen.getByRole('button', { name: 'Importer' });
    expect(importButton).toBeDisabled();
    expect(mockImportRange).not.toHaveBeenCalled();
  });

  it('imports a range and shows a success message', async () => {
    mockImportRange.mockResolvedValue(mockRange);
    renderImportExport();
    const textarea = screen.getByLabelText(/Contenu à importer/i);
    fireEvent.change(textarea, { target: { value: 'AA: open' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importer' }));
    await waitFor(() => {
      expect(mockImportRange).toHaveBeenCalledWith('AA: open', 'json');
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/succès/i);
    });
    expect(mockFetchRanges).toHaveBeenCalled();
  });

  it('shows an error when import fails', async () => {
    mockImportRange.mockRejectedValue(new Error('bad format'));
    renderImportExport();
    const textarea = screen.getByLabelText(/Contenu à importer/i);
    fireEvent.change(textarea, { target: { value: 'garbage' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importer' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/import/i);
    });
  });

  it('switches to the export tab and lists ranges', async () => {
    renderImportExport();
    fireEvent.click(screen.getByRole('tab', { name: /Exporter/ }));
    await screen.findByTestId('range-list');
    expect(screen.getByTestId('range-item-1')).toBeInTheDocument();
  });

  it('disables the download button when no range is selected on the export tab', async () => {
    renderImportExport();
    fireEvent.click(screen.getByRole('tab', { name: /Exporter/ }));
    await screen.findByTestId('range-list');
    const downloadButton = screen.getByRole('button', { name: /Télécharger/i });
    expect(downloadButton).toBeDisabled();
  });

  it('selects a range via the list and triggers setSelectedRange', async () => {
    renderImportExport();
    fireEvent.click(screen.getByRole('tab', { name: /Exporter/ }));
    await screen.findByTestId('range-item-1');
    fireEvent.click(screen.getByTestId('range-item-1'));
    expect(mockSetSelectedRange).toHaveBeenCalledWith(mockRange);
  });

  it('downloads an export when a range is already selected', async () => {
    const exportResult = { name: 'Export Range', hands: { AA: 'open' } };
    mockExportRange.mockResolvedValue(exportResult);
    mockUseRanges.mockReturnValue({
      ranges: mockRanges,
      loading: false,
      error: null as string | null,
      selectedRange: mockRange,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
    // jsdom lacks URL.createObjectURL / revokeObjectURL; stub them so the
    // download branch of handleExport runs without throwing.
    const createObjectURL = jest.fn(() => 'blob:url');
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: { ...window.URL, createObjectURL, revokeObjectURL },
    });

    renderImportExport();
    fireEvent.click(screen.getByRole('tab', { name: /Exporter/ }));
    const downloadButton = await screen.findByRole('button', { name: /Télécharger/i });
    expect(downloadButton).not.toBeDisabled();
    fireEvent.click(downloadButton);
    await waitFor(() => {
      expect(mockExportRange).toHaveBeenCalledWith(1, 'json');
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/succès/i);
    });
  });
});
