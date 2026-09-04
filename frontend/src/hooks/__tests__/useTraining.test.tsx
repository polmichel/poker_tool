import { renderHook, act } from '@testing-library/react';
import { useTraining } from '../useTraining';
import { TrainingApi } from '../../api';

// Mock TrainingApi so the hook is tested without any network layer.
// This follows the DI design: the hook accepts a TrainingApi instance,
// so we inject a fake whose methods return controlled promises.
function makeFakeTrainingApi() {
  const fake: any = {};
  for (const method of [
    'sessions',
    'session',
    'createSession',
    'start',
    'answer',
    'end',
    'sessionsByUser',
    'modes',
    'list',
  ]) {
    fake[method] = jest.fn();
  }
  return fake as jest.Mocked<TrainingApi>;
}

describe('useTraining Hook', () => {
  beforeEach(() => {
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  });

  it('initializes with correct default values', () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([]);
    const { result } = renderHook(() => useTraining(fakeApi));
    expect(result.current.sessions).toEqual([]);
    expect(result.current.currentSession).toBeNull();
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches training sessions successfully', async () => {
    const fakeApi = makeFakeTrainingApi();
    const mockSessions = [
      { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 },
      { id: 2, user_id: 1, range_id: 2, mode: 'quiz', score: 90 },
    ];
    fakeApi.sessions.mockResolvedValue(mockSessions);
    fakeApi.list.mockResolvedValue(mockSessions);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.fetchSessions();
    });
    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles error when fetching sessions', async () => {
    const fakeApi = makeFakeTrainingApi();
    const errorWithMessage = new Error("Erreur lors du chargement des sessions d'entraenement");
    fakeApi.sessions.mockRejectedValue(errorWithMessage);
    fakeApi.list.mockRejectedValue(errorWithMessage);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.fetchSessions();
    });
    expect(result.current.error).toBe("Erreur lors du chargement des sessions d'entraenement");
    expect(result.current.loading).toBe(false);
  });

  it('fetches a specific session successfully', async () => {
    const fakeApi = makeFakeTrainingApi();
    const mockSession = { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85, total_questions: 10 };
    const mockResponse = {
      id: 1,
      session: mockSession,
      current_question: null,
      progress: { current: 0, total: 10, score: 0 },
    };
    // fetchSession calls trainingApi.session() and reads .session/.current_question/.progress
    fakeApi.session.mockResolvedValue(mockResponse as any);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.fetchSession(1);
    });
    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.progress).toEqual({ current: 0, total: 10, score: 0 });
    expect(result.current.loading).toBe(false);
  });

  it('handles error when fetching a specific session', async () => {
    const fakeApi = makeFakeTrainingApi();
    const errorWithMessage = new Error("Erreur lors du chargement de la session 1");
    fakeApi.session.mockRejectedValue(errorWithMessage);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.fetchSession(1);
    });
    expect(result.current.error).toBe("Erreur lors du chargement de la session 1");
    expect(result.current.loading).toBe(false);
  });

  it('creates a new training session', async () => {
    const fakeApi = makeFakeTrainingApi();
    const mockPayload = { range_id: 1, mode: 'fill', time_limit: 30 };
    const mockResponse = {
      session: { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 0, total_questions: 10 },
      first_question: null,
      progress: { current: 0, total: 10, score: 0 },
    };
    fakeApi.createSession.mockResolvedValue(mockResponse as any);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.createSession(1, 'fill', 1, 10);
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles error when creating a session', async () => {
    const fakeApi = makeFakeTrainingApi();
    const errorWithMessage = new Error("Erreur lors de la creation de la session");
    fakeApi.createSession.mockRejectedValue(errorWithMessage);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.createSession(1, 'fill', 1, 10);
    });
    expect(result.current.error).toBe('Erreur lors de la creation de la session');
    expect(result.current.loading).toBe(false);
  });
});
