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
      { id: 2, user_id: 1, range_id: 2, mode: 'guess', score: 90 },
    ];
    fakeApi.sessions.mockResolvedValue(mockSessions as any);
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
    fakeApi.sessions.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.fetchSessions();
    });
    expect(result.current.error).toBe("Erreur lors du chargement des sessions d'entraînement");
    expect(result.current.loading).toBe(false);
  });

  it('fetches a specific session successfully', async () => {
    const fakeApi = makeFakeTrainingApi();
    const mockSession = { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 };
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
      const session = await result.current.fetchSession(1);
      expect(session).toEqual(mockResponse);
    });
    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.loading).toBe(false);
  });

  it('starts a training session successfully', async () => {
    const fakeApi = makeFakeTrainingApi();
    const mockResponse = {
      id: 1,
      session: { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 0, total_questions: 10 },
      first_question: { type: 'fill', hand: 'AA', question: 'Quelle action pour AA ?' },
    };
    fakeApi.createSession.mockResolvedValue(mockResponse as any);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      await result.current.createSession('fill', 1);
    });
    expect(result.current.currentSession).toEqual(mockResponse.session);
    expect(result.current.currentQuestion).toEqual(mockResponse.first_question);
    expect(result.current.isSessionActive).toBe(true);
  });

  it('handles nextQuestion correctly', async () => {
    const fakeApi = makeFakeTrainingApi();
    const mockResponse = {
      next_question: { type: 'fill', hand: 'KK', question: 'Quelle action pour KK ?' },
      is_correct: true,
      correct_answer: 'open',
      session_complete: false,
      progress: { current: 1, total: 10, correct: 1, score: 50 },
    };
    fakeApi.answer.mockResolvedValue(mockResponse as any);
    const { result } = renderHook(() => useTraining(fakeApi));

    await act(async () => {
      const response = await result.current.nextQuestion(1, 'open');
      expect(response).toEqual({
        isCorrect: true,
        correctAnswer: 'open',
        sessionComplete: false,
        nextQuestion: mockResponse.next_question,
      });
    });

    expect(result.current.currentQuestion).toEqual(mockResponse.next_question);
    expect(result.current.score).toBe(50);
  });

  it('ends a training session successfully', async () => {
    const fakeApi = makeFakeTrainingApi();
    const mockSession = { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 };
    fakeApi.end.mockResolvedValue({ message: 'Session ended', session: mockSession as any });
    fakeApi.sessions.mockResolvedValue([]);

    const { result } = renderHook(() => useTraining(fakeApi));
    await act(async () => {
      await result.current.endSession(1);
    });

    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.isSessionActive).toBe(false);
  });
});
