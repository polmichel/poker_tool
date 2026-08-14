import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { TrainingSession, TrainingMode, TrainingQuestion, Range } from '../types';

// URL de base pour l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Hook personnalisé pour gérer l'entraînement
export function useTraining() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TrainingQuestion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/training/sessions');
      setSessions(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des sessions d\'entraînement');
      console.error('Error fetching training sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger une session spécifique
  const fetchSession = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/training/sessions/${id}`);
      const sessionData = response.data;
      setCurrentSession(sessionData.session);
      setCurrentQuestion(sessionData.current_question);
      setProgress(sessionData.progress);
      setScore(sessionData.progress?.score || 0);
      setTimeSpent(sessionData.session?.time_spent || 0);
      setIsSessionActive(sessionData.progress?.current < sessionData.progress?.total);
      return sessionData;
    } catch (err) {
      setError(`Erreur lors du chargement de la session ${id}`);
      console.error(`Error fetching session ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer une nouvelle session d'entraînement
  const createSession = useCallback(async (
    mode: TrainingMode,
    rangeId: number,
    userId?: number,
    totalQuestions: number = 10
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      // POST /training/sessions creates the session AND returns the first
      // question (questions are generated at creation), so no separate
      // /start call is needed.
      const createResponse = await api.post('/training/sessions', {
        mode,
        range_id: rangeId,
        user_id: userId,
        total_questions: totalQuestions,
      });
      
      const sessionData = createResponse.data;
      
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
      setError('Erreur lors de la création de la session d\'entraînement');
      console.error('Error creating training session:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Passer à la question suivante
  const nextQuestion = useCallback(async (sessionId: number, answer: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/training/sessions/${sessionId}/next`,
        { answer }
      );
      
      const result = response.data;
      
      // Update state based on response
      if (result.session_complete) {
        // Session is complete
        setIsSessionActive(false);
        setCurrentQuestion(null);
        setProgress({
          current: result.progress?.current || progress.total,
          total: result.progress?.total || progress.total,
          correct: result.progress?.correct || progress.correct,
        });
        setScore(result.progress?.score || score);
        
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
        setCurrentQuestion(result.next_question);
        setProgress({
          current: result.progress?.current || 0,
          total: result.progress?.total || 0,
          correct: result.progress?.correct || 0,
        });
        setScore(result.progress?.score || 0);
        setTimeSpent(result.progress?.time_spent || 0);
        
        return {
          isCorrect: result.is_correct,
          correctAnswer: result.correct_answer,
          sessionComplete: false,
          nextQuestion: result.next_question,
        };
      }
    } catch (err) {
      setError(`Erreur lors de la soumission de la réponse`);
      console.error('Error submitting answer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [progress, score]);

  // Terminer une session d'entraînement
  const endSession = useCallback(async (sessionId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/training/sessions/${sessionId}/end`);
      setIsSessionActive(false);
      setCurrentSession(response.data.session);
      setCurrentQuestion(null);
      fetchSessions();
      return response.data;
    } catch (err) {
      setError(`Erreur lors de la fin de la session ${sessionId}`);
      console.error(`Error ending session ${sessionId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  // Démarrer rapidement une session (avec paramètres par défaut)
  const quickStart = useCallback(async (mode: TrainingMode, rangeId: number, userId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // POST /training/sessions creates the session AND returns the first
      // question (questions are generated at creation), so no separate
      // /start call is needed.
      const createResponse = await api.post('/training/sessions', {
        mode,
        range_id: rangeId,
        user_id: userId,
        total_questions: 10,
      });
      
      const sessionData = createResponse.data;
      
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
      setError('Erreur lors du démarrage rapide');
      console.error('Error quick starting:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les modes d'entraînement disponibles
  const fetchTrainingModes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/training/modes');
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des modes d\'entraînement');
      console.error('Error fetching training modes:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Réinitialiser l'état
  const resetTrainingState = useCallback(() => {
    setCurrentSession(null);
    setCurrentQuestion(null);
    setIsSessionActive(false);
    setScore(0);
    setTimeSpent(0);
    setProgress({ current: 0, total: 0, correct: 0 });
    setError(null);
  }, []);

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
    setCurrentSession,
    setCurrentQuestion,
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
