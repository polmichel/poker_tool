/**
 * useTrainingSession - Manages training session state and lifecycle
 *
 * This hook handles:
 * - Session creation and management
 * - Session fetching and state updates
 * - Session lifecycle (start, end, reset)
 * - Quick start functionality
 *
 * @hook
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { TrainingApi } from '../api';
import { TrainingSession, TrainingMode, TrainingQuestion } from '../types';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';

export interface TrainingSessionState {
  sessions: TrainingSession[];
  currentSession: TrainingSession | null;
  currentQuestion: TrainingQuestion | null;
  loading: boolean;
  error: string | null;
  score: number;
  isSessionActive: boolean;
  timeSpent: number;
  progress: {
    current: number;
    total: number;
    correct: number;
  };
}

export interface TrainingSessionActions {
  setIsSessionActive: (active: boolean) => void;
  fetchSessions: () => Promise<void>;
  fetchSession: (id: number) => Promise<{
    session: TrainingSession;
    current_question: TrainingQuestion | null;
    progress: { current: number; total: number; correct: number; score: number };
  } | null>;
  createSession: (
    mode: TrainingMode,
    rangeId: number,
    userId?: number,
    totalQuestions?: number,
  ) => Promise<{
    session: TrainingSession;
    first_question: TrainingQuestion | null;
  } | null>;
  quickStart: (
    mode: TrainingMode,
    rangeId: number,
    userId?: number,
  ) => Promise<{
    session: TrainingSession;
    first_question: TrainingQuestion | null;
  } | null>;
  endSession: (sessionId: number) => Promise<{ message: string; session: TrainingSession } | null>;
  resetTrainingState: () => void;
}

export type UseTrainingSessionReturn = TrainingSessionState & TrainingSessionActions;

/**
 * Hook for managing training session state and lifecycle
 */
export function useTrainingSession(trainingApi?: TrainingApi): UseTrainingSessionReturn {
  const apiRef = useRef<TrainingApi>(trainingApi ?? new TrainingApi());
  const api = apiRef.current;

  // State
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TrainingQuestion | null>(null);
  const { loading, error, run, setError } = useAsyncState(true);
  const [score, setScore] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    correct: number;
  }>({ current: 0, total: 0, correct: 0 });

  // Fetch all training sessions
  const fetchSessions = useCallback(async () => {
    try {
      const data = await run(() => api.sessions());
      setSessions(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Erreur lors du chargement des sessions d'entraînement"));
      console.error('Error fetching training sessions:', err);
    }
  }, [api, run, setError]);

  // Fetch a specific session
  const fetchSession = useCallback(
    async (id: number) => {
      try {
        const sessionData = await run(() => api.session(id));
        setCurrentSession(sessionData.session);
        setCurrentQuestion(sessionData.current_question);
        setProgress(sessionData.progress);
        setScore(sessionData.progress?.score || 0);
        setTimeSpent(sessionData.session?.time_spent || 0);
        setIsSessionActive(sessionData.progress?.current < sessionData.progress?.total);
        return sessionData;
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors du chargement de la session ${id}`));
        console.error(`Error fetching session ${id}:`, err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Create a new training session
  const createSession = useCallback(
    async (mode: TrainingMode, rangeId: number, userId?: number, totalQuestions: number = 10) => {
      try {
        const sessionData = await run(() =>
          api.createSession({
            mode,
            range_id: rangeId,
            user_id: userId,
            total_questions: totalQuestions,
          }),
        );

        setCurrentSession(sessionData.session);
        setCurrentQuestion(sessionData.first_question);
        setProgress({
          current: 0,
          total: sessionData.session.total_questions || totalQuestions,
          correct: 0,
        });
        setScore(0);
        setTimeSpent(0);
        setIsSessionActive(true);

        return sessionData;
      } catch (err) {
        setError(
          extractErrorMessage(err, "Erreur lors de la création de la session d'entraînement"),
        );
        console.error('Error creating training session:', err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Quick start a session with default parameters
  const quickStart = useCallback(
    async (mode: TrainingMode, rangeId: number, userId?: number) => {
      try {
        const sessionData = await run(() =>
          api.createSession({
            mode,
            range_id: rangeId,
            user_id: userId,
            total_questions: 10,
          }),
        );

        setCurrentSession(sessionData.session);
        setCurrentQuestion(sessionData.first_question);
        setProgress({
          current: 0,
          total: sessionData.session.total_questions || 10,
          correct: 0,
        });
        setScore(0);
        setTimeSpent(0);
        setIsSessionActive(true);

        return sessionData;
      } catch (err) {
        setError(extractErrorMessage(err, 'Erreur lors du démarrage rapide'));
        console.error('Error quick starting:', err);
        return null;
      }
    },
    [api, run, setError],
  );

  // End a training session
  const endSession = useCallback(
    async (sessionId: number) => {
      try {
        const data = await run(() => api.end(sessionId));
        setIsSessionActive(false);
        setCurrentSession(data.session);
        setCurrentQuestion(null);
        fetchSessions();
        return data;
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors de la fin de la session ${sessionId}`));
        console.error(`Error ending session ${sessionId}:`, err);
        return null;
      }
    },
    [fetchSessions, api, run, setError],
  );

  // Reset training state
  const resetTrainingState = useCallback(() => {
    setCurrentSession(null);
    setCurrentQuestion(null);
    setIsSessionActive(false);
    setScore(0);
    setTimeSpent(0);
    setProgress({ current: 0, total: 0, correct: 0 });
    setError(null);
  }, [setError]);

  // Initialize the hook
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    // State
    sessions,
    currentSession,
    currentQuestion,
    loading,
    error,
    score,
    isSessionActive,
    timeSpent,
    progress,
    // Actions
    setIsSessionActive,
    fetchSessions,
    fetchSession,
    createSession,
    quickStart,
    endSession,
    resetTrainingState,
  };
}
