import { renderHook, act } from '@testing-library/react';
import { useTrainingQuestions } from '../useTrainingQuestions';
import { TrainingApi } from '../../api';
import { makeTrainingQuestion } from '../../tests/factories';
import type { NextQuestionResponse } from '../../api/TrainingApi.types';

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

describe('useTrainingQuestions Hook', () => {
  beforeEach(() => {
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  });

  it('initializes with no feedback', () => {
    const fakeApi = makeFakeTrainingApi();
    const { result } = renderHook(() => useTrainingQuestions(fakeApi));
    expect(result.current.feedback).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('produces feedback with the next question when the session is not complete', async () => {
    const fakeApi = makeFakeTrainingApi();
    const next = makeTrainingQuestion({ hand: 'AQs', correct_answer: 'raise' });
    const apiResponse: NextQuestionResponse = {
      is_correct: false,
      correct_answer: 'raise',
      session_complete: false,
      progress: { current: 1, total: 10, correct: 0, score: 0 },
      next_question: next,
    };
    fakeApi.answer.mockResolvedValue(apiResponse);
    const { result } = renderHook(() => useTrainingQuestions(fakeApi));

    await act(async () => {
      await result.current.nextQuestion(1, 'open', {
        current: 0,
        total: 10,
        correct: 0,
        score: 0,
      });
    });

    expect(fakeApi.answer).toHaveBeenCalledWith(1, 'open');
    expect(result.current.feedback?.isCorrect).toBe(false);
    expect(result.current.feedback?.correctAnswer).toBe('raise');
    expect(result.current.feedback?.sessionComplete).toBe(false);
    expect(result.current.feedback?.nextQuestion).toEqual(next);
  });

  it('produces final feedback with finalScore/results when the session completes', async () => {
    const fakeApi = makeFakeTrainingApi();
    const apiResponse: NextQuestionResponse = {
      is_correct: true,
      correct_answer: 'open',
      session_complete: true,
      progress: { current: 10, total: 10, correct: 8, score: 80 },
    };
    fakeApi.answer.mockResolvedValue(apiResponse);
    const { result } = renderHook(() => useTrainingQuestions(fakeApi));

    await act(async () => {
      await result.current.nextQuestion(1, 'open', {
        current: 9,
        total: 10,
        correct: 7,
        score: 70,
      });
    });

    expect(result.current.feedback?.sessionComplete).toBe(true);
    expect(result.current.feedback?.isCorrect).toBe(true);
    expect(result.current.feedback?.finalScore).toBe(80);
    expect(result.current.feedback?.finalResults).toEqual({ correct: 8, total: 10 });
    expect(result.current.feedback?.nextQuestion).toBeUndefined();
  });

  it('clearFeedback resets the feedback state', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.answer.mockResolvedValue({
      is_correct: true,
      correct_answer: 'open',
      session_complete: false,
      progress: { current: 1, total: 10, correct: 1, score: 0 },
      next_question: makeTrainingQuestion(),
    });
    const { result } = renderHook(() => useTrainingQuestions(fakeApi));

    await act(async () => {
      await result.current.nextQuestion(1, 'open', {
        current: 0,
        total: 10,
        correct: 0,
        score: 0,
      });
    });
    expect(result.current.feedback).not.toBeNull();

    act(() => {
      result.current.clearFeedback();
    });
    expect(result.current.feedback).toBeNull();
  });

  it('surfaces an error and returns null when submitting an answer fails', async () => {
    const fakeApi = makeFakeTrainingApi();
    fakeApi.answer.mockRejectedValue(new Error('Erreur lors de la soumission de la réponse'));
    const { result } = renderHook(() => useTrainingQuestions(fakeApi));

    let returned: unknown = 'set';
    await act(async () => {
      returned = await result.current.nextQuestion(1, 'open', {
        current: 0,
        total: 10,
        correct: 0,
        score: 0,
      });
    });
    expect(returned).toBeNull();
    expect(result.current.error).toBe('Erreur lors de la soumission de la réponse');
    expect(result.current.feedback).toBeNull();
  });
});
