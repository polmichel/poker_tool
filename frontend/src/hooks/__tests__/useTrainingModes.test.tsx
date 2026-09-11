import { renderHook, act } from '@testing-library/react';
import { useTrainingModes } from '../useTrainingModes';
import { TrainingApi } from '../../api';

function makeFakeTrainingApi() {
  const fake: any = {};
  for (const method of [
    'modes',
    'sessions',
    'session',
    'createSession',
    'start',
    'answer',
    'end',
    'sessionsByUser',
    'list',
  ]) {
    fake[method] = jest.fn();
  }
  return fake as jest.Mocked<TrainingApi>;
}

describe('useTrainingModes Hook', () => {
  beforeEach(() => {});

  it('initializes with empty modes and loading=true', () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.modes.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTrainingModes(fakeApi));
    expect(result.current.modes).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetchTrainingModes populates modes and clears loading', async () => {
    const fakeApi = makeFakeTrainingApi();
    const modes = [
      { value: 'fill', label: 'Remplir' },
      { value: 'guess', label: 'Deviner' },
    ];
    fakeApi.modes.mockResolvedValue(modes);
    const { result } = renderHook(() => useTrainingModes(fakeApi));
    let returned: unknown = null;
    await act(async () => {
      returned = await result.current.fetchTrainingModes();
    });
    expect(returned).toEqual(modes);
    expect(result.current.modes).toEqual(modes);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('surfaces a default error message when fetching modes fails with a non-Error rejection', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.modes.mockRejectedValue('boom');
    const { result } = renderHook(() => useTrainingModes(fakeApi));
    let returned: unknown = 'set';
    await act(async () => {
      returned = await result.current.fetchTrainingModes();
    });
    expect(returned).toBeNull();
    expect(result.current.error).toBe("Erreur lors du chargement des modes d'entraînement");
    expect(result.current.loading).toBe(false);
    expect(result.current.modes).toEqual([]);
  });

  it('uses the Error message when the rejection is an Error', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.modes.mockRejectedValue(new Error('custom modes error'));
    const { result } = renderHook(() => useTrainingModes(fakeApi));
    await act(async () => {
      await result.current.fetchTrainingModes();
    });
    expect(result.current.error).toBe('custom modes error');
  });

  it('clears loading after a successful fetch followed by a failure', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.modes.mockResolvedValueOnce([{ value: 'fill', label: 'Remplir' }]);
    const { result } = renderHook(() => useTrainingModes(fakeApi));
    await act(async () => {
      await result.current.fetchTrainingModes();
    });
    expect(result.current.modes).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    fakeApi.modes.mockRejectedValue(new Error('second failure'));
    await act(async () => {
      await result.current.fetchTrainingModes();
    });
    expect(result.current.error).toBe('second failure');
    expect(result.current.loading).toBe(false);
  });
});
