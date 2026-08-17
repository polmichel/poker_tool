import { renderHook, act } from '@testing-library/react';
import { useEquity } from '../useEquity';
import { EquityApi } from '../../api';
import { EquityResult } from '../../types';

// Mock EquityApi so the hook is tested without any network layer.
// Follows the DI design: the hook accepts an EquityApi instance.
function makeFakeEquityApi() {
  return {
    simulate: jest.fn(),
  } as unknown as jest.Mocked<EquityApi>;
}

describe('useEquity Hook', () => {
  beforeEach(() => {
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  });

  it('initializes with correct default values', () => {
    const fakeApi = makeFakeEquityApi();
    const { result } = renderHook(() => useEquity(fakeApi));
    expect(result.current.result).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('simulates equity successfully', async () => {
    const fakeApi = makeFakeEquityApi();
    const mockResult: EquityResult = {
      hero: 'AKs',
      win: 46.5,
      tie: 1.0,
      lose: 52.5,
      iterations: 1000,
      by_hand: [{ hand: 'QQ', combos: 6, win: 46.5, tie: 1.0, lose: 52.5 }],
    };
    fakeApi.simulate.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useEquity(fakeApi));

    await act(async () => {
      await result.current.simulate('AKs', 'QQ', 1000);
    });

    expect(fakeApi.simulate).toHaveBeenCalledWith('AKs', 'QQ', 1000);
    expect(result.current.result).toEqual(mockResult);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles simulation errors', async () => {
    const fakeApi = makeFakeEquityApi();
    fakeApi.simulate.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useEquity(fakeApi));

    await act(async () => {
      await result.current.simulate('AKs', 'QQ', 1000);
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('resets state', async () => {
    const fakeApi = makeFakeEquityApi();
    const mockResult: EquityResult = {
      hero: 'AKs',
      win: 46.5,
      tie: 1.0,
      lose: 52.5,
      iterations: 1000,
      by_hand: [],
    };
    fakeApi.simulate.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useEquity(fakeApi));

    await act(async () => {
      await result.current.simulate('AKs', 'QQ', 1000);
    });
    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
