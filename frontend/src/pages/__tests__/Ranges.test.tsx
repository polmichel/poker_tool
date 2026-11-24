/**
 * Unit tests for the Ranges page component.
 * Tests the new folder-based range management functionality.
 */
import React from 'react';
import { render, screen, fireEvent, act, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import Ranges from '../Ranges';
import type { Range } from '../../types';

// Mock useRanges hook
const mockFetchRanges = jest.fn();
const mockCreateRange = jest.fn();
const mockUpdateRange = jest.fn();
const mockDeleteRange = jest.fn();
const mockImportRange = jest.fn();
const mockExportRange = jest.fn();

const mockRanges: Range[] = [
  {
    id: 1,
    name: 'UTG Range',
    description: 'Opening range from UTG',
    range_type: 'preflop',
    position: 'UTG',
    hands: { AA: 'open', KK: 'open', AKs: 'open' },
  },
  {
    id: 2,
    name: 'BTN Range',
    description: 'Opening range from BTN',
    range_type: 'preflop',
    position: 'BTN',
    hands: { AA: 'open', KK: 'open', QQ: 'open', AKs: 'open', AQs: 'open' },
  },
];

const mockSetSelectedRange = jest.fn();

const mockUseRanges = jest.fn(() => ({
  ranges: mockRanges,
  loading: false,
  error: null as string | null,
  selectedRange: null,
  setSelectedRange: mockSetSelectedRange,
  fetchRanges: mockFetchRanges,
  createRange: mockCreateRange,
  updateRange: mockUpdateRange,
  deleteRange: mockDeleteRange,
  importRange: mockImportRange,
  exportRange: mockExportRange,
}));

vi.mock('../../hooks/useRanges', () => ({
  useRanges: () => mockUseRanges(),
}));

// Mock useRangeFolders (depends on AuthContext + localStorage). Exposes a
// single root folder containing all mock ranges, mirroring real behavior.
const mockCreateFolder = jest.fn(() => `folder_${Date.now()}`);
const mockMoveRangeToFolder = jest.fn();
const mockRenameFolder = jest.fn();
const mockDeleteFolder = jest.fn();
// Folders state can be overridden per-test via mockFoldersState.
let mockFoldersState: any[] = [
  {
    id: 'root',
    name: 'Toutes les Ranges',
    parentId: null,
    rangeIds: [1, 2],
    children: [],
  },
];
vi.mock('../../hooks/useRangeFolders', () => ({
  useRangeFolders: () => ({
    folders: mockFoldersState,
    createFolder: mockCreateFolder,
    moveRangeToFolder: mockMoveRangeToFolder,
    renameFolder: mockRenameFolder,
    deleteFolder: mockDeleteFolder,
  }),
}));

// Mock generateRangeGrid
vi.mock('../../utils/helpers', () => ({
  generateRangeGrid: jest.fn(() => []),
}));

// Mock THEME_COLORS
vi.mock('../../utils/constants', () => ({
  THEME_COLORS: {
    paperElevated: '#1a1a1a',
    paper: '#121212',
    border: '#333',
    borderStrong: '#444',
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#10b981',
    secondary: '#22d3ee',
    secondaryDark: '#06b6d4',
    background: '#0a0a0a',
    backgroundGradient: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    success: '#4caf50',
  },
}));

const renderRanges = () =>
  render(
    <MemoryRouter>
      <Ranges />
    </MemoryRouter>,
  );

describe('Ranges page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [],
      },
    ];
    mockUseRanges.mockReturnValue({
      ranges: mockRanges,
      loading: false,
      error: null,
      selectedRange: null,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      createRange: mockCreateRange,
      updateRange: mockUpdateRange,
      deleteRange: mockDeleteRange,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
  });

  it('renders without crashing', () => {
    renderRanges();
    expect(screen.getByText('Gestion des Ranges')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseRanges.mockReturnValue({
      ranges: [],
      loading: true,
      error: null,
      selectedRange: null,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      createRange: mockCreateRange,
      updateRange: mockUpdateRange,
      deleteRange: mockDeleteRange,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
    renderRanges();
    expect(screen.getByText('Chargement des ranges...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseRanges.mockReturnValue({
      ranges: [],
      loading: false,
      error: 'Failed to load ranges',
      selectedRange: null,
      setSelectedRange: mockSetSelectedRange,
      fetchRanges: mockFetchRanges,
      createRange: mockCreateRange,
      updateRange: mockUpdateRange,
      deleteRange: mockDeleteRange,
      importRange: mockImportRange,
      exportRange: mockExportRange,
    });
    renderRanges();
    expect(screen.getByText('Failed to load ranges')).toBeInTheDocument();
  });

  it('displays folder tree with root folder', () => {
    renderRanges();
    expect(screen.getByText('Dossiers')).toBeInTheDocument();
    expect(screen.getByText('Toutes les Ranges')).toBeInTheDocument();
  });

  it('displays range list', () => {
    renderRanges();
    expect(screen.getByText('Ranges (2)')).toBeInTheDocument();
    expect(screen.getByText('UTG Range')).toBeInTheDocument();
    expect(screen.getByText('BTN Range')).toBeInTheDocument();
  });

  it('displays search input', () => {
    renderRanges();
    const searchInput = screen.getByPlaceholderText('Rechercher une range...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays new range button', () => {
    renderRanges();
    expect(screen.getByTestId('new-range-button')).toBeInTheDocument();
  });

  it('displays new folder button', () => {
    renderRanges();
    expect(screen.getByText('Nouveau Dossier')).toBeInTheDocument();
  });

  it('displays refresh button', () => {
    renderRanges();
    const refreshButtons = screen.getAllByRole('button', { name: /actualiser/i });
    expect(refreshButtons.length).toBeGreaterThan(0);
  });

  it('displays import/export button', () => {
    renderRanges();
    expect(screen.getByText('Importer/Exporter')).toBeInTheDocument();
  });

  it('filters ranges based on search query', async () => {
    const user = userEvent.setup();
    renderRanges();

    const searchInput = screen.getByPlaceholderText('Rechercher une range...');
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      await user.type(searchInput, 'UTG');
    });

    // Should only show UTG Range
    expect(screen.getByText('UTG Range')).toBeInTheDocument();
    expect(screen.queryByText('BTN Range')).not.toBeInTheDocument();
  });

  it('shows message when no range is selected', () => {
    renderRanges();
    expect(screen.getByText('Sélectionnez une range pour voir ses détails')).toBeInTheDocument();
  });

  it('calls fetchRanges on mount', () => {
    renderRanges();
    expect(mockFetchRanges).toHaveBeenCalled();
  });

  it('calls fetchRanges when refresh button is clicked', async () => {
    const user = userEvent.setup();
    renderRanges();

    const refreshButtons = screen.getAllByRole('button', { name: /actualiser/i });
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      await user.click(refreshButtons[0]);
    });

    expect(mockFetchRanges).toHaveBeenCalledTimes(2);
  });

  it('displays range count correctly', () => {
    renderRanges();
    expect(screen.getByText(/Ranges \(2\)/)).toBeInTheDocument();
  });

  it('displays range type and position information', () => {
    renderRanges();
    // The range info is displayed in the list items
    const rangeItems = screen.getAllByText(/preflop/);
    expect(rangeItems.length).toBeGreaterThan(0);
  });

  it('makes range list items draggable', () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const utgItem = screen.getByText('UTG Range').closest('[draggable]');
    expect(utgItem).toBeTruthy();
    // eslint-disable-next-line testing-library/no-node-access
    expect(utgItem?.getAttribute('draggable')).toBe('true');
  });

  it('drops a dragged range onto a folder and calls moveRangeToFolder', async () => {
    // Provide a target subfolder to drop onto.
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [{ id: 'folder_btn', name: 'BTN', parentId: 'root', rangeIds: [], children: [] }],
      },
    ];
    renderRanges();

    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const folderItem = screen.getByText('BTN');
    expect(rangeItem).toBeTruthy();
    expect(folderItem).toBeTruthy();

    // Simulate the native HTML5 DnD event sequence. dragOver + drop must fire
    // in the same act batch so the drop handler sees the updated dragging state.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      // eslint-disable-next-line testing-library/no-node-access
      // Mock dataTransfer for dragStart event
      const mockDataTransfer = { setData: jest.fn() };
      Object.defineProperty(rangeItem!, 'dataTransfer', {
        value: mockDataTransfer,
        writable: true,
      });
      fireEvent.dragStart(rangeItem!, { dataTransfer: mockDataTransfer });
    });
    const folderTarget = screen.getByText('BTN');
    // eslint-disable-next-line testing-library/no-unnecessary-act
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragOver(folderTarget, {
        dataTransfer: { dropEffect: 'move' },
      });
      fireEvent.drop(folderTarget, {
        dataTransfer: { dropEffect: 'move' },
      });
    });

    expect(mockMoveRangeToFolder).toHaveBeenCalledWith(1, 'folder_btn');
  });

  it('does not move a range when dragOver happens without an active drag', async () => {
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [{ id: 'folder_btn', name: 'BTN', parentId: 'root', rangeIds: [], children: [] }],
      },
    ];
    renderRanges();
    const folderItem = screen.getByText('BTN');
    // drop without a preceding dragStart: nothing should be moved.
    // eslint-disable-next-line testing-library/no-unnecessary-act, testing-library/no-node-access
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.drop(folderItem!, { dataTransfer: { dropEffect: 'move' } });
    });
    expect(mockMoveRangeToFolder).not.toHaveBeenCalled();
  });

  // Realistic DataTransfer mock mimicking the browser: data written by
  // setData is readable via getData, and `types` exposes the available formats.
  const makeDataTransfer = () => {
    const store: Record<string, string> = {};
    return {
      dropEffect: '',
      effectAllowed: '',
      types: [] as string[],
      setData(format: string, value: string) {
        store[format] = value;
        if (!this.types.includes(format)) this.types.push(format);
      },
      getData(format: string) {
        return store[format] ?? '';
      },
    };
  };

  it('does NOT cancel the dragstart event (a canceled dragstart aborts the whole drag in real browsers)', () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dragStartEvent = createEvent.dragStart(rangeItem!, {
      dataTransfer: makeDataTransfer(),
    });
    fireEvent(rangeItem!, dragStartEvent);
    // If the dragstart handler calls preventDefault(), browsers never start
    // the drag session: no dragover/drop is ever fired and the feature is
    // broken in real usage (unit/e2e synthetic events hide this).
    expect(dragStartEvent.defaultPrevented).toBe(false);
  });

  it('stores the range id as text/plain in dataTransfer on dragstart', () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    fireEvent.dragStart(rangeItem!, { dataTransfer });
    expect(dataTransfer.getData('text/plain')).toBe('1');
    expect(dataTransfer.types).toContain('text/plain');
    expect(dataTransfer.effectAllowed).toBe('move');
  });

  it('cancels dragover on a folder while a range is being dragged (required to allow the drop)', async () => {
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [{ id: 'folder_btn', name: 'BTN', parentId: 'root', rangeIds: [], children: [] }],
      },
    ];
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragStart(rangeItem!, { dataTransfer });
    });
    const folderTarget = screen.getByText('BTN');
    const dragOverEvent = createEvent.dragOver(folderTarget, { dataTransfer });
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent(folderTarget, dragOverEvent);
    });
    // preventDefault on dragover is what tells the browser a drop is allowed.
    expect(dragOverEvent.defaultPrevented).toBe(true);
  });

  it('accepts dragover based on the dataTransfer payload even without component state', () => {
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [{ id: 'folder_btn', name: 'BTN', parentId: 'root', rangeIds: [], children: [] }],
      },
    ];
    renderRanges();
    const folderTarget = screen.getByText('BTN');
    // No dragStart fired: only the dataTransfer payload identifies the drag.
    const dataTransfer = makeDataTransfer();
    dataTransfer.setData('text/plain', '1');
    const dragOverEvent = createEvent.dragOver(folderTarget, { dataTransfer });
    fireEvent(folderTarget, dragOverEvent);
    expect(dragOverEvent.defaultPrevented).toBe(true);
  });

  it('moves the range on drop using the dataTransfer payload (real browser flow)', async () => {
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [{ id: 'folder_btn', name: 'BTN', parentId: 'root', rangeIds: [], children: [] }],
      },
    ];
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragStart(rangeItem!, { dataTransfer });
    });
    // Re-query the folder AFTER the dragStart re-render so the node is attached.
    const folderTarget = screen.getByText('BTN');
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragOver(folderTarget, { dataTransfer });
      fireEvent.drop(folderTarget, { dataTransfer });
    });
    expect(mockMoveRangeToFolder).toHaveBeenCalledWith(1, 'folder_btn');
  });

  it('moves the range on drop from the dataTransfer payload even without prior dragStart state', async () => {
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [{ id: 'folder_btn', name: 'BTN', parentId: 'root', rangeIds: [], children: [] }],
      },
    ];
    renderRanges();
    const folderTarget = screen.getByText('BTN');
    const dataTransfer = makeDataTransfer();
    dataTransfer.setData('text/plain', '2');
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.drop(folderTarget, { dataTransfer });
    });
    expect(mockMoveRangeToFolder).toHaveBeenCalledWith(2, 'folder_btn');
  });

  it('clears the drag ghost on drop even when no dragend fires (card may unmount after the move)', async () => {
    mockFoldersState = [
      {
        id: 'root',
        name: 'Toutes les Ranges',
        parentId: null,
        rangeIds: [1, 2],
        children: [{ id: 'folder_btn', name: 'BTN', parentId: 'root', rangeIds: [], children: [] }],
      },
    ];
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragStart(rangeItem!, { dataTransfer });
    });
    // Le ghost est visible pendant le drag.
    expect(screen.getByTestId('range-ghost-element')).toBeInTheDocument();
    // Re-query the folder AFTER the dragStart re-render so the node is attached.
    const folderTarget = screen.getByText('BTN');
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragOver(folderTarget, { dataTransfer });
      fireEvent.drop(folderTarget, { dataTransfer });
      // PAS de dragend ici : dans un vrai navigateur, si le drop demonte la
      // carte source, le dragend est émis sur un nœud détaché et n'atteint
      // jamais React. Le drop doit donc nettoyer le ghost lui-même.
    });
    expect(mockMoveRangeToFolder).toHaveBeenCalledWith(1, 'folder_btn');
    expect(screen.queryByTestId('range-ghost-element')).not.toBeInTheDocument();
  });

  it('clears the drag ghost on dragend', async () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragStart(rangeItem!, { dataTransfer });
    });
    expect(screen.getByTestId('range-ghost-element')).toBeInTheDocument();
    // Re-query the card AFTER the dragStart re-render so the node is attached.
    // (the ghost also shows the range name, so pick the one inside [draggable])
    const rangeItemAfter = screen
      .getAllByText('UTG Range')
      // eslint-disable-next-line testing-library/no-node-access
      .map((el) => el.closest('[draggable]'))
      .find((el): el is Element => el !== null);
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragEnd(rangeItemAfter!, { dataTransfer });
    });
    expect(screen.queryByTestId('range-ghost-element')).not.toBeInTheDocument();
  });

  it('moves the ghost on document-level dragover while dragging (pointer outside the card)', async () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    const withXY = (evt: Event, x: number, y: number) => {
      Object.defineProperty(evt, 'clientX', { value: x });
      Object.defineProperty(evt, 'clientY', { value: y });
      return evt;
    };
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent(rangeItem!, withXY(createEvent.dragStart(rangeItem!, { dataTransfer }), 600, 200));
    });
    const ghost = screen.getByTestId('range-ghost-element');
    expect(ghost.getAttribute('data-x')).toBe(String(600 - 140));
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      // dragover anywhere in the document (pointer far outside the card)
      fireEvent(
        document.body,
        withXY(createEvent.dragOver(document.body, { dataTransfer }), 200, 500),
      );
    });
    expect(screen.getByTestId('range-ghost-element').getAttribute('data-x')).toBe(
      String(200 - 140),
    );
    expect(screen.getByTestId('range-ghost-element').getAttribute('data-y')).toBe(String(500 - 30));
  });

  it('clears a stuck ghost on document-level dragend (card dragend may never reach React)', async () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragStart(rangeItem!, { dataTransfer });
    });
    expect(screen.getByTestId('range-ghost-element')).toBeInTheDocument();
    // Simulate a dragend that never reaches the card's React handler
    // (e.g. source node detached): it bubbles to document instead.
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragEnd(document.body, { dataTransfer });
    });
    expect(screen.queryByTestId('range-ghost-element')).not.toBeInTheDocument();
  });

  it('keeps the range card DOM node stable across the dragstart re-render (native drags are canceled if the source node is replaced)', async () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragStart(rangeItem!, { dataTransfer });
    });
    // The card node must NOT be replaced when the ghost appears: panels are
    // inline function calls, not components, so their DOM stays stable.
    // eslint-disable-next-line testing-library/no-node-access
    expect(rangeItem!.isConnected).toBe(true);
  });

  it('clears a stuck ghost on any mousedown (safety net)', async () => {
    renderRanges();
    // eslint-disable-next-line testing-library/no-node-access
    const rangeItem = screen.getByText('UTG Range').closest('[draggable]');
    const dataTransfer = makeDataTransfer();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.dragStart(rangeItem!, { dataTransfer });
    });
    expect(screen.getByTestId('range-ghost-element')).toBeInTheDocument();
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      fireEvent.mouseDown(document.body);
    });
    expect(screen.queryByTestId('range-ghost-element')).not.toBeInTheDocument();
  });
});
