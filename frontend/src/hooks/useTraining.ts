import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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

  // Charger toutes les sessions d'entraînement
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/training/sessions`);
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
      const response = await axios.get(`${API_BASE_URL}/training/sessions/${id}`);
      setCurrentSession(response.data);
      return response.data;
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
    userId?: number
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/training/sessions`, {
        mode,
        range_id: rangeId,
        user_id: userId,
      });
      setCurrentSession(response.data);
      return response.data;
    } catch (err) {
      setError('Erreur lors de la création de la session d\'entraînement');
      console.error('Error creating training session:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Démarrer une session d'entraînement
  const startSession = useCallback(async (sessionId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/training/sessions/${sessionId}/start`);
      setCurrentSession(response.data.session);
      setCurrentQuestion(response.data.first_question);
      setIsSessionActive(true);
      setScore(0);
      setTimeSpent(0);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du démarrage de la session ${sessionId}`);
      console.error(`Error starting session ${sessionId}:`, err);
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
      const response = await axios.post(
        `${API_BASE_URL}/training/sessions/${sessionId}/next`,
        { answer }
      );
      
      setCurrentSession(response.data.session);
      setCurrentQuestion(response.data.next_question);
      setScore(response.data.session.score);
      setTimeSpent(response.data.session.time_spent);
      
      if (!response.data.next_question) {
        setIsSessionActive(false);
      }
      
      return {
        isCorrect: response.data.is_correct,
        correctAnswer: response.data.correct_answer,
      };
    } catch (err) {
      setError(`Erreur lors de la soumission de la réponse`);
      console.error('Error submitting answer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Terminer une session d'entraînement
  const endSession = useCallback(async (sessionId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/training/sessions/${sessionId}/end`);
      setCurrentSession(response.data.session);
      setIsSessionActive(false);
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

  // Obtenir les résultats d'une session
  const getSessionResults = useCallback(async (sessionId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/training/sessions/${sessionId}/results`);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du chargement des résultats de la session ${sessionId}`);
      console.error(`Error fetching results for session ${sessionId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Démarrer rapidement une session (avec paramètres par défaut)
  const quickStart = useCallback(async (mode: TrainingMode, rangeId: number, userId?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/training/quick-start`, {
        mode,
        range_id: rangeId,
        user_id: userId,
      });
      
      setCurrentSession(response.data.session);
      setCurrentQuestion(response.data.first_question);
      setIsSessionActive(true);
      setScore(0);
      setTimeSpent(0);
      
      return response.data;
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
      const response = await axios.get(`${API_BASE_URL}/training/modes`);
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
    setCurrentSession,
    setCurrentQuestion,
    setIsSessionActive,
    fetchSessions,
    fetchSession,
    createSession,
    startSession,
    nextQuestion,
    endSession,
    getSessionResults,
    quickStart,
    fetchTrainingModes,
    resetTrainingState,
  };
}
