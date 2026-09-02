/* eslint-disable testing-library/no-node-access -- localStorage access is intentional for persistence tests */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useRangeFolders } from '../useRangeFolders';

// Mock AuthContext so useRangeFolders gets a stable user id for the
// localStorage key without needing the full AuthProvider.
let mockUserId: number | undefined = 1;
jest.mock('../../auth/AuthContext', () => ({
  useAuthContext: () => ({ user: mockUserId ? { id: mockUserId } : null }),
}));

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <React.Fragment>{children}</React.Fragment>
);

const renderFolders = (allRangeIds: number[]) =>
  renderHook(() => useRangeFolders(allRangeIds), { wrapper });

describe('useRangeFolders hook', () => {
  beforeEach(() => {
    mockUserId = 1;
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('builds a root folder containing all unassigned ranges', () => {
    const { result } = renderFolders([1, 2, 3]);
    expect(result.current.folders).toHaveLength(1);
    const root = result.current.folders[0];
    expect(root.id).toBe('root');
    expect(root.rangeIds).toEqual([1, 2, 3]);
    expect(root.children).toEqual([]);
  });

  it('persists created folders to localStorage', () => {
    const { result } = renderFolders([1, 2]);
    act(() => {
      result.current.createFolder('Open-raises', 'root');
    });
    const raw = localStorage.getItem('poker_tool_folders_1');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Open-raises');
  });

  it('restores folders from localStorage on next load', () => {
    const { result } = renderFolders([1, 2]);
    act(() => {
      result.current.createFolder('3bet', 'root');
    });
    // Re-render: the persisted folder should be reloaded.
    const { result: result2 } = renderFolders([1, 2]);
    expect(result2.current.folders[0].children).toHaveLength(1);
    expect(result2.current.folders[0].children[0].name).toBe('3bet');
  });

  it('moves a range into a subfolder and removes it from root', () => {
    const { result } = renderFolders([1, 2, 3]);
    act(() => {
      result.current.createFolder('BTN', 'root');
    });
    const folderId = result.current.folders[0].children[0].id;
    act(() => {
      result.current.moveRangeToFolder(1, folderId);
    });
    const root = result.current.folders[0];
    expect(root.rangeIds).toEqual([2, 3]);
    expect(root.children[0].rangeIds).toEqual([1]);
  });

  it('move back to root reassigns the range', () => {
    const { result } = renderFolders([1, 2]);
    act(() => {
      result.current.createFolder('CO', 'root');
    });
    const folderId = result.current.folders[0].children[0].id;
    act(() => {
      result.current.moveRangeToFolder(2, folderId);
    });
    act(() => {
      result.current.moveRangeToFolder(2, 'root');
    });
    const root = result.current.folders[0];
    expect(root.rangeIds).toContain(2);
    expect(root.children[0].rangeIds).not.toContain(2);
  });

  it('move to the same folder is a no-op', () => {
    const { result } = renderFolders([1, 2]);
    act(() => {
      result.current.createFolder('MP', 'root');
    });
    const folderId = result.current.folders[0].children[0].id;
    act(() => {
      result.current.moveRangeToFolder(1, folderId);
    });
    const before = JSON.stringify(result.current.folders);
    act(() => {
      result.current.moveRangeToFolder(1, folderId);
    });
    expect(JSON.stringify(result.current.folders)).toBe(before);
  });

  it('renameFolder updates the name', () => {
    const { result } = renderFolders([1]);
    act(() => {
      result.current.createFolder('old', 'root');
    });
    const folderId = result.current.folders[0].children[0].id;
    act(() => {
      result.current.renameFolder(folderId, 'new');
    });
    expect(result.current.folders[0].children[0].name).toBe('new');
  });

  it('deleteFolder reassigns its ranges to the parent', () => {
    const { result } = renderFolders([1, 2]);
    act(() => {
      result.current.createFolder('UTG', 'root');
    });
    const folderId = result.current.folders[0].children[0].id;
    act(() => {
      result.current.moveRangeToFolder(2, folderId);
    });
    act(() => {
      result.current.deleteFolder(folderId);
    });
    const root = result.current.folders[0];
    expect(root.children).toHaveLength(0);
    // range 2 reassigned back to root
    expect(root.rangeIds).toContain(2);
  });

  it('creates nested folders under a selected subfolder', () => {
    const { result } = renderFolders([1]);
    act(() => {
      result.current.createFolder('parent', 'root');
    });
    const parentId = result.current.folders[0].children[0].id;
    act(() => {
      result.current.createFolder('child', parentId);
    });
    const parent = result.current.folders[0].children[0];
    expect(parent.children).toHaveLength(1);
    expect(parent.children[0].name).toBe('child');
  });

  it('persists per user (separate localStorage key)', () => {
    const { result } = renderFolders([1]);
    act(() => {
      result.current.createFolder('user1-folder', 'root');
    });
    // Switch user
    mockUserId = 2;
    const { result: result2 } = renderFolders([1]);
    expect(result2.current.folders[0].children).toHaveLength(0);
  });

  it('tolerates corrupted localStorage gracefully', () => {
    localStorage.setItem('poker_tool_folders_1', '{not valid json');
    const { result } = renderFolders([1]);
    expect(result.current.folders).toHaveLength(1);
    expect(result.current.folders[0].rangeIds).toEqual([1]);
  });

  it('keeps new ranges in root when ranges list grows', () => {
    const { result } = renderFolders([1, 2]);
    act(() => {
      result.current.createFolder('open', 'root');
    });
    const folderId = result.current.folders[0].children[0].id;
    act(() => {
      result.current.moveRangeToFolder(1, folderId);
    });
    // Simulate a new range loaded (range id 3 added)
    const { result: result2 } = renderFolders([1, 2, 3]);
    const root = result2.current.folders[0];
    expect(root.rangeIds).toContain(3);
    expect(root.children[0].rangeIds).toEqual([1]);
  });
});
