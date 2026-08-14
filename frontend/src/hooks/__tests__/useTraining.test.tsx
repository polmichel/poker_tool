import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { useTraining } from '../useTraining';

// Mock axios so the shared 'api' instance (axios.create) in utils/api.ts is a
// mock with jest spy methods, without running the real network layer or the
// localStorage-backed interceptors. The factory must be self-contained (it is
// hoisted above all variable declarations), so it builds the mock object and
// exposes it through axios.create().
jest.mock('axios', () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockApi),
    },
  };
});

// Retrieve the mocked api instance that api.ts created via axios.create().
const mockedApi = axios.create() as jest.Mocked<{
  get: jest.Mock;
  post: jest.Mock;
}>;

describe('useTraining Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useTraining());
    expect(result.current.sessions).toEqual([]);
    expect(result.current.currentSession).toBeNull();
    expect(result.current.currentQuestion).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches training sessions successfully', async () => {
    const mockSessions = [
      { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 },
      { id: 2, user_id: 1, range_id: 2, mode: 'guess', score: 90 },
    ];
    mockedApi.get.mockResolvedValue({ data: mockSessions });

    const { result } = renderHook(() => useTraining());
    await act(async () => {
      await result.current.fetchSessions();
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles error when fetching sessions', async () => {
    mockedApi.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTraining());
    await act(async () => {
      await result.current.fetchSessions();
    });

    expect(result.current.error).toBe('Erreur lors du chargement des sessions d\'entraînement');
    expect(result.current.loading).toBe(false);
  });

  it('fetches a specific session successfully', async () => {
    // fetchSession reads sessionData.session, sessionData.current_question
    // and sessionData.progress, so the mock response must match that shape.
    const mockSession = { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 };
    const mockResponse = {
      session: mockSession,
      current_question: null,
      progress: { current: 0, total: 10, score: 0 },
    };
    mockedApi.get.mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useTraining());
    await act(async () => {
      const session = await result.current.fetchSession(1);
      expect(session).toEqual(mockResponse);
    });

    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.loading).toBe(false);
  });

  it('starts a training session successfully', async () => {
    const mockResponse = {
      session: { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 0, total_questions: 10 },
      first_question: { type: 'fill', hand: 'AA', question: 'Quelle action pour AA ?' },
    };
    mockedApi.post.mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useTraining());
    await act(async () => {
      // createSession signature is (mode, rangeId, userId?, totalQuestions?)
      await result.current.createSession('fill', 1);
    });

    expect(result.current.currentSession).toEqual(mockResponse.session);
    expect(result.current.currentQuestion).toEqual(mockResponse.first_question);
    expect(result.current.isSessionActive).toBe(true);
  });

  it('handles nextQuestion correctly', async () => {
    const mockResponse = {
      next_question: { type: 'fill', hand: 'KK', question: 'Quelle action pour KK ?' },
      is_correct: true,
      correct_answer: 'open',
      progress: { current: 1, total: 10, correct: 1, score: 50 },
    };
    mockedApi.post.mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useTraining());
    await act(async () => {
      const response = await result.current.nextQuestion(1, 'open');
      // For a non-complete response the hook returns isCorrect, correctAnswer,
      // sessionComplete and the next question.
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
    const mockSession = { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 };
    mockedApi.post.mockResolvedValue({ data: { session: mockSession } });

    const { result } = renderHook(() => useTraining());
    await act(async () => {
      await result.current.endSession(1);
    });

    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.isSessionActive).toBe(false);
  });
});
