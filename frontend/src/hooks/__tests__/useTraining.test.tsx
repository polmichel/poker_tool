import { renderHook, act } from '@testing-library/react';
import { useTraining } from '../useTraining';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

    mockedAxios.get.mockResolvedValue({ data: mockSessions });

    const { result } = renderHook(() => useTraining());

    await act(async () => {
      await result.current.fetchSessions();
    });

    expect(result.current.sessions).toEqual(mockSessions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles error when fetching sessions', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTraining());

    await act(async () => {
      await result.current.fetchSessions();
    });

    expect(result.current.error).toBe('Erreur lors du chargement des sessions d\'entra\u00eenement');
    expect(result.current.loading).toBe(false);
  });

  it('fetches a specific session successfully', async () => {
    const mockSession = { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 };

    mockedAxios.get.mockResolvedValue({ data: mockSession });

    const { result } = renderHook(() => useTraining());

    await act(async () => {
      const session = await result.current.fetchSession(1);
      expect(session).toEqual(mockSession);
    });

    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.loading).toBe(false);
  });

  it('starts a training session successfully', async () => {
    const mockResponse = {
      session: { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 0 },
      first_question: { type: 'fill', hand: 'AA', question: 'Quelle action pour AA ?' },
    };

    mockedAxios.post.mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useTraining());

    await act(async () => {
      await result.current.startSession(1, 'fill');
    });

    expect(result.current.currentSession).toEqual(mockResponse.session);
    expect(result.current.currentQuestion).toEqual(mockResponse.first_question);
    expect(result.current.isSessionActive).toBe(true);
  });

  it('handles nextQuestion correctly', async () => {
    const mockResponse = {
      session: { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 50 },
      next_question: { type: 'fill', hand: 'KK', question: 'Quelle action pour KK ?' },
      is_correct: true,
      correct_answer: 'open',
    };

    mockedAxios.post.mockResolvedValue({ data: mockResponse });

    const { result } = renderHook(() => useTraining());

    await act(async () => {
      const response = await result.current.nextQuestion(1, 'open');
      expect(response).toEqual({ isCorrect: true, correctAnswer: 'open' });
    });

    expect(result.current.currentSession).toEqual(mockResponse.session);
    expect(result.current.currentQuestion).toEqual(mockResponse.next_question);
    expect(result.current.score).toBe(50);
  });

  it('ends a training session successfully', async () => {
    const mockSession = { id: 1, user_id: 1, range_id: 1, mode: 'fill', score: 85 };

    mockedAxios.post.mockResolvedValue({ data: { session: mockSession } });

    const { result } = renderHook(() => useTraining());

    await act(async () => {
      await result.current.endSession(1);
    });

    expect(result.current.currentSession).toEqual(mockSession);
    expect(result.current.isSessionActive).toBe(false);
  });
});
