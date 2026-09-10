import { renderHook, act, waitFor } from '@testing-library/react';
import { useRanges } from '../useRanges';
import { RangesApi } from '../../api';
import { makeRange } from '../../tests/factories';

function makeFakeRangesApi() {
  const fake: any = {};
  for (const method of [
    'ranges',
    'range',
    'create',
    'update',
    'delete',
    'rangesByUser',
    'search',
    'grid',
    'stats',
    'exportRange',
    'importRange',
  ]) {
    fake[method] = jest.fn();
  }
  return fake as jest.Mocked<RangesApi>;
}

describe('useRanges Hook', () => {
  beforeEach(() => {
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  });

  it('initializes with empty ranges and no selected range', () => {
    const fakeApi = makeFakeRangesApi();
    fakeApi.ranges.mockResolvedValue([]);
    const { result } = renderHook(() => useRanges(fakeApi, false));

    expect(result.current.ranges).toEqual([]);
    expect(result.current.selectedRange).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('auto-fetches ranges on mount when autoFetch is true', async () => {
    const fakeApi = makeFakeRangesApi();
    const mockRanges = [makeRange(), makeRange({ id: 2, name: 'Range 2' })];
    fakeApi.ranges.mockResolvedValue(mockRanges);
    const { result } = renderHook(() => useRanges(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fakeApi.ranges).toHaveBeenCalled();
    expect(result.current.ranges).toEqual(mockRanges);
    expect(result.current.error).toBeNull();
  });

  it('does not auto-fetch when autoFetch is false', async () => {
    const fakeApi = makeFakeRangesApi();
    fakeApi.ranges.mockResolvedValue([makeRange()]);
    const { result } = renderHook(() => useRanges(fakeApi, false));

    // give any pending effects a chance to run
    await act(async () => {
      await Promise.resolve();
    });
    expect(fakeApi.ranges).not.toHaveBeenCalled();
    expect(result.current.ranges).toEqual([]);
  });

  it('fetches a single range and selects it', async () => {
    const fakeApi = makeFakeRangesApi();
    const single = makeRange({ id: 5, name: 'Single' });
    fakeApi.range.mockResolvedValue(single);
    const { result } = renderHook(() => useRanges(fakeApi, false));

    let fetched: ReturnType<typeof makeRange> | null = null;
    await act(async () => {
      fetched = await result.current.fetchRange(5);
    });

    expect(fakeApi.range).toHaveBeenCalledWith(5);
    expect(fetched).toEqual(single);
    expect(result.current.selectedRange).toEqual(single);
  });

  it('creates a range, appends it to the list, and selects it', async () => {
    const fakeApi = makeFakeRangesApi();
    const created = makeRange({ id: 3, name: 'Created' });
    fakeApi.create.mockResolvedValue(created);
    const { result } = renderHook(() => useRanges(fakeApi, false));

    let returned: ReturnType<typeof makeRange> | null = null;
    await act(async () => {
      returned = await result.current.createRange({
        name: 'Created',
        description: '',
        range_type: 'preflop',
        position: 'BTN',
        effective_stack_bb: null,
        hands: { AKs: 'open' },
      });
    });

    expect(returned).toEqual(created);
    expect(result.current.ranges).toContainEqual(created);
    expect(result.current.selectedRange).toEqual(created);
  });

  it('updates a range in the list and updates the selection', async () => {
    const fakeApi = makeFakeRangesApi();
    const original = makeRange({ id: 1, name: 'Original' });
    fakeApi.ranges.mockResolvedValue([original]);
    const updated = makeRange({ id: 1, name: 'Updated' });
    fakeApi.update.mockResolvedValue(updated);
    const { result } = renderHook(() => useRanges(fakeApi));

    await waitFor(() => expect(result.current.ranges).toHaveLength(1));
    act(() => {
      result.current.setSelectedRange(original);
    });

    await act(async () => {
      await result.current.updateRange(1, { name: 'Updated' });
    });

    expect(fakeApi.update).toHaveBeenCalledWith(1, { name: 'Updated' });
    expect(result.current.ranges.find((r) => r.id === 1)).toEqual(updated);
    expect(result.current.selectedRange).toEqual(updated);
  });

  it('deletes a range and clears the selection if it was selected', async () => {
    const fakeApi = makeFakeRangesApi();
    const doomed = makeRange({ id: 7, name: 'Doomed' });
    fakeApi.ranges.mockResolvedValue([doomed]);
    fakeApi.delete.mockResolvedValue({ message: 'deleted' });
    const { result } = renderHook(() => useRanges(fakeApi));

    await waitFor(() => expect(result.current.ranges).toHaveLength(1));
    act(() => {
      result.current.setSelectedRange(doomed);
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.deleteRange(7);
    });

    expect(ok).toBe(true);
    expect(result.current.ranges).toEqual([]);
    expect(result.current.selectedRange).toBeNull();
  });

  it('surfaces an error when fetching ranges fails', async () => {
    const fakeApi = makeFakeRangesApi();
    fakeApi.ranges.mockRejectedValue(new Error('Erreur lors du chargement des ranges'));
    const { result } = renderHook(() => useRanges(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Erreur lors du chargement des ranges');
    expect(result.current.ranges).toEqual([]);
  });
});
