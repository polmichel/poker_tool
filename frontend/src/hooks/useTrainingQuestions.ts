/**
 * useTrainingQuestions - Manages training question flow and feedback
 *
 * This hook handles:
 * - Submitting answers to training questions
 * - Managing feedback for answers
 * - Progress tracking
 *
 * @hook
 */
import { useState, useCallback, useRef } from 'react';
import { TrainingApi } from '../api';
import { TrainingQuestion } from '../types';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';

export interface Feedback {
  isCorrect: boolean;
  correctAnswer: string | null;
  sessionComplete: boolean;
  finalScore?: number;
  finalResults?: {
    correct: number;
    total: number;
  };
  nextQuestion?: TrainingQuestion;
}

export interface TrainingQuestionsState {
  feedback: Feedback | null;
  loading: boolean;
  error: string | null;
}

export interface TrainingQuestionsActions {
  nextQuestion: (
    sessionId: number,
    answer: string,
    currentProgress: { current: number; total: number; correct: number; score: number },
  ) => Promise<Feedback | null>;
  clearFeedback: () => void;
}

export type UseTrainingQuestionsReturn = TrainingQuestionsState & TrainingQuestionsActions;

/**
 * Hook for managing training question flow and feedback
 *
 * @param trainingApi - Optional TrainingApi instance for testing
 */
export function useTrainingQuestions(trainingApi?: TrainingApi): UseTrainingQuestionsReturn {
  const apiRef = useRef<TrainingApi>(trainingApi ?? new TrainingApi());
  const api = apiRef.current;

  // State
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { loading, error, run, setError } = useAsyncState(false);

  // Submit an answer and get the next question
  const nextQuestion = useCallback(
    async (
      sessionId: number,
      answer: string,
      currentProgress: { current: number; total: number; correct: number; score: number },
    ): Promise<Feedback | null> => {
      try {
        const result = await run(() => api.answer(sessionId, answer));

        // Update state based on response
        // NOTE: when the session is complete we deliberately keep the current
        // question and the session active so the feedback panel stays mounted
        // in the page until the user clicks "Voir les résultats". Closing the
        // session (setIsSessionActive(false) + setCurrentQuestion(null)) is
        // driven by the page's handleNextQuestion, which also opens the results
        // dialog. Doing it here would unmount the question component (and its
        // feedback panel) before the user can read it.
        if (result.session_complete) {
          const feedbackData: Feedback = {
            isCorrect: result.is_correct,
            correctAnswer: result.correct_answer,
            sessionComplete: true,
            finalScore: result.progress?.score,
            finalResults: {
              correct: result.progress?.correct,
              total: result.progress?.total,
            },
          };
          
          setFeedback(feedbackData);
          return feedbackData;
        } else {
          // There's a next question
          const feedbackData: Feedback = {
            isCorrect: result.is_correct,
            correctAnswer: result.correct_answer,
            sessionComplete: false,
            nextQuestion: result.next_question,
          };
          
          setFeedback(feedbackData);
          return feedbackData;
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Erreur lors de la soumission de la réponse'));
        console.error('Error submitting answer:', err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Clear feedback
  const clearFeedback = useCallback(() => {
    setFeedback(null);
  }, []);

  return {
    // State
    feedback,
    loading,
    error,
    // Actions
    nextQuestion,
    clearFeedback,
  };
}
