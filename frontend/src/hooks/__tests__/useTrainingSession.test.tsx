import { renderHook, act, waitFor } from '@testing-library/react';
import { useTrainingSession } from '../useTrainingSession';
import { TrainingApi } from '../../api';
import { makeTrainingSession, makeTrainingQuestion } from '../../tests/factories';
import type { CreateSessionResponse, SessionDetail } from '../../api/TrainingApi.types';
import type { TrainingSession, TrainingQuestion } from '../../types/domain/training';

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

const sampleSession = (): ReturnType<typeof makeTrainingSession> =>
  makeTrainingSession({ id: 1, total_questions: 10 });

describe('useTrainingSession Hook', () => {
  beforeEach(() => {
  });

  it('auto-fetches sessions on mount', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([sampleSession()]);
    const { result } = renderHook(() => useTrainingSession(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fakeApi.sessions).toHaveBeenCalled();
    expect(result.current.sessions).toHaveLength(1);
  });

  it('quickStart creates a session with default 10 questions and activates it', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([]);
    const firstQuestion = makeTrainingQuestion();
    const createResponse: CreateSessionResponse = {
      id: 1,
      session: sampleSession(),
      first_question: firstQuestion,
    };
    fakeApi.createSession.mockResolvedValue(createResponse);
    const { result } = renderHook(() => useTrainingSession(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    let returned:
      { session: TrainingSession; first_question: TrainingQuestion | null } | null | undefined;
    await act(async () => {
      returned = await result.current.quickStart('fill', 1, 1);
    });

    expect(fakeApi.createSession).toHaveBeenCalledWith({
      mode: 'fill',
      range_id: 1,
      user_id: 1,
      total_questions: 10,
    });
    expect(returned).toEqual(createResponse);
    expect(result.current.currentSession).toEqual(createResponse.session);
    expect(result.current.currentQuestion).toEqual(firstQuestion);
    expect(result.current.isSessionActive).toBe(true);
    expect(result.current.progress).toEqual({ current: 0, total: 10, correct: 0 });
    expect(result.current.score).toBe(0);
  });

  it('createSession honours the totalQuestions argument', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([]);
    const createResponse: CreateSessionResponse = {
      id: 2,
      session: makeTrainingSession({ id: 2, total_questions: 20 }),
      first_question: makeTrainingQuestion(),
    };
    fakeApi.createSession.mockResolvedValue(createResponse);
    const { result } = renderHook(() => useTrainingSession(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createSession('guess', 1, 1, 20);
    });

    expect(fakeApi.createSession).toHaveBeenCalledWith({
      mode: 'guess',
      range_id: 1,
      user_id: 1,
      total_questions: 20,
    });
    expect(result.current.progress.total).toBe(20);
    expect(result.current.isSessionActive).toBe(true);
  });

  it('endSession deactivates the session and refreshes the list', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([sampleSession()]);
    const endedSession = makeTrainingSession({ id: 1, score: 90 });
    fakeApi.end.mockResolvedValue({ message: 'ended', session: endedSession });
    const { result } = renderHook(() => useTrainingSession(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.setIsSessionActive(true);
    });

    let returned: { message: string; session: TrainingSession } | null | undefined;
    await act(async () => {
      returned = await result.current.endSession(1);
    });

    expect(fakeApi.end).toHaveBeenCalledWith(1);
    expect((returned as { message: string })?.message).toBe('ended');
    expect(result.current.isSessionActive).toBe(false);
    expect(result.current.currentSession).toEqual(endedSession);
    expect(result.current.currentQuestion).toBeNull();
    expect(fakeApi.sessions).toHaveBeenCalledTimes(2);
  });

  it('fetchSession populates state from the session detail', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([]);
    const detail: SessionDetail = {
      id: 7,
      session: makeTrainingSession({ id: 7, time_spent: 300 }),
      current_question: makeTrainingQuestion(),
      progress: { current: 3, total: 10, correct: 2, score: 67 },
    };
    fakeApi.session.mockResolvedValue(detail);
    const { result } = renderHook(() => useTrainingSession(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    let returned:
      | {
          session: TrainingSession;
          current_question: TrainingQuestion | null;
          progress: { current: number; total: number; correct: number; score?: number };
        }
      | null
      | undefined;
    await act(async () => {
      returned = await result.current.fetchSession(7);
    });

    expect(fakeApi.session).toHaveBeenCalledWith(7);
    expect(returned).toEqual(detail);
    expect(result.current.currentSession?.id).toBe(7);
    expect(result.current.currentQuestion).toEqual(detail.current_question);
    expect(result.current.score).toBe(67);
    expect(result.current.timeSpent).toBe(300);
    expect(result.current.isSessionActive).toBe(true);
  });

  it('resetTrainingState clears session, question, score and progress', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([]);
    const createResponse: CreateSessionResponse = {
      id: 1,
      session: sampleSession(),
      first_question: makeTrainingQuestion(),
    };
    fakeApi.createSession.mockResolvedValue(createResponse);
    const { result } = renderHook(() => useTrainingSession(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.createSession('fill', 1, 1, 10);
    });
    expect(result.current.isSessionActive).toBe(true);

    act(() => {
      result.current.resetTrainingState();
    });
    expect(result.current.currentSession).toBeNull();
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.isSessionActive).toBe(false);
    expect(result.current.score).toBe(0);
    expect(result.current.timeSpent).toBe(0);
    expect(result.current.progress).toEqual({ current: 0, total: 0, correct: 0 });
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error when createSession fails', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.sessions.mockResolvedValue([]);
    fakeApi.createSession.mockRejectedValue(
      new Error("Erreur lors de la création de la session d'entraînement"),
    );
    const { result } = renderHook(() => useTrainingSession(fakeApi));

    await waitFor(() => expect(result.current.loading).toBe(false));
    let returned: unknown = 'set';
    await act(async () => {
      returned = await result.current.createSession('fill', 1, 1, 10);
    });
    expect(returned).toBeNull();
    expect(result.current.error).toBe("Erreur lors de la création de la session d'entraînement");
    expect(result.current.isSessionActive).toBe(false);
  });
});
