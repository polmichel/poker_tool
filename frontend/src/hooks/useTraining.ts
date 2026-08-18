import { useState, useEffect, useCallback, useRef } from 'react';
import { TrainingApi } from '../api';
import { TrainingSession, TrainingMode, TrainingQuestion } from '../types';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';

// Hook personnalisé pour gérer l'entraînement.
// Dépend de TrainingApi (injectable) plutôt que d'appeler axios directement.
export function useTraining(trainingApi?: TrainingApi) {
  const trainingApiRef = useRef<TrainingApi>(trainingApi ?? new TrainingApi());
  const api = trainingApiRef.current;
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

  // Charger toutes les sessions d'entraînement
  const fetchSessions = useCallback(async () => {
    try {
      const data = await run(() => api.sessions());
      setSessions(data);
    } catch (err) {
      setError(extractErrorMessage(err, "Erreur lors du chargement des sessions d'entraînement"));
      console.error('Error fetching training sessions:', err);
    }
  }, [api, run, setError]);

  // Charger une session spécifique
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

  // Créer une nouvelle session d'entraînement
  const createSession = useCallback(
    async (mode: TrainingMode, rangeId: number, userId?: number, totalQuestions: number = 10) => {
      try {
        // POST /training/sessions creates the session AND returns the first
        // question (questions are generated at creation), so no separate
        // /start call is needed.
        const sessionData = await run(() =>
          api.createSession({
            mode,
            range_id: rangeId,
            user_id: userId,
            total_questions: totalQuestions,
          }),
        );

        // Set session and first question
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

  // Passer à la question suivante
  const nextQuestion = useCallback(
    async (sessionId: number, answer: string) => {
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
          setProgress({
            current: result.progress?.current || progress.total,
            total: result.progress?.total || progress.total,
            correct: result.progress?.correct || progress.correct,
          });
          setScore(result.progress?.score ?? score);

          return {
            isCorrect: result.is_correct,
            correctAnswer: result.correct_answer,
            sessionComplete: true,
            finalScore: result.progress?.score,
            finalResults: {
              correct: result.progress?.correct,
              total: result.progress?.total,
            },
          };
        } else {
          // There's a next question
          setCurrentQuestion(result.next_question || null);
          setProgress({
            current: result.progress?.current || 0,
            total: result.progress?.total || 0,
            correct: result.progress?.correct || 0,
          });
          setScore(result.progress?.score || 0);

          return {
            isCorrect: result.is_correct,
            correctAnswer: result.correct_answer,
            sessionComplete: false,
            nextQuestion: result.next_question,
          };
        }
      } catch (err) {
        setError(extractErrorMessage(err, 'Erreur lors de la soumission de la réponse'));
        console.error('Error submitting answer:', err);
        return null;
      }
    },
    [progress, score, api, run, setError],
  );

  // Terminer une session d'entraînement
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

  // Démarrer rapidement une session (avec paramètres par défaut)
  const quickStart = useCallback(
    async (mode: TrainingMode, rangeId: number, userId?: number) => {
      try {
        // POST /training/sessions creates the session AND returns the first
        // question (questions are generated at creation), so no separate
        // /start call is needed.
        const sessionData = await run(() =>
          api.createSession({
            mode,
            range_id: rangeId,
            user_id: userId,
            total_questions: 10,
          }),
        );

        // Set session and first question
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

  // Obtenir les modes d'entraînement disponibles
  const fetchTrainingModes = useCallback(async () => {
    try {
      return await run(() => api.modes());
    } catch (err) {
      setError(extractErrorMessage(err, "Erreur lors du chargement des modes d'entraînement"));
      console.error('Error fetching training modes:', err);
      return null;
    }
  }, [api, run, setError]);

  // Réinitialiser l'état
  const resetTrainingState = useCallback(() => {
    setCurrentSession(null);
    setCurrentQuestion(null);
    setIsSessionActive(false);
    setScore(0);
    setTimeSpent(0);
    setProgress({ current: 0, total: 0, correct: 0 });
    setError(null);
  }, [setError]);

  // Initialiser le hook
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    currentSession,
    currentQuestion,
    loading,
    error,
    score,
    isSessionActive,
    timeSpent,
    progress,
    // NOTE: setIsSessionActive is exposed because Training.tsx drives the
    // session lifecycle from the page. A future refactor of Training.tsx
    // should replace these with higher-level intentions on the hook.
    setIsSessionActive,
    fetchSessions,
    fetchSession,
    createSession,
    nextQuestion,
    endSession,
    quickStart,
    fetchTrainingModes,
    resetTrainingState,
  };
}
