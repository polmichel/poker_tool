import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Stats, UserStats } from '../types';

// URL de base pour l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Hook personnalisé pour gérer les statistiques
export function useStats() {
  const [globalStats, setGlobalStats] = useState<Stats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques globales
  const fetchGlobalStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/`);
      setGlobalStats(response.data);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des statistiques globales');
      console.error('Error fetching global stats:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les statistiques d'un utilisateur
  const fetchUserStats = useCallback(async (userId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/user/${userId}`);
      setUserStats(response.data);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du chargement des statistiques de l'utilisateur ${userId}`);
      console.error(`Error fetching user stats for ${userId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les statistiques d'une range
  const fetchRangeStats = useCallback(async (rangeId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/range/${rangeId}`);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du chargement des statistiques de la range ${rangeId}`);
      console.error(`Error fetching range stats for ${rangeId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger l'historique des sessions
  const fetchTrainingHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/history`);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique des sessions');
      console.error('Error fetching training history:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger le classement
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/leaderboard`);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement du classement');
      console.error('Error fetching leaderboard:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger la progression pour une range
  const fetchRangeProgress = useCallback(async (rangeId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/range/${rangeId}/progress`);
      return response.data;
    } catch (err) {
      setError(`Erreur lors du chargement de la progression de la range ${rangeId}`);
      console.error(`Error fetching range progress for ${rangeId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Exporter les statistiques
  const exportStats = useCallback(async (format: 'json' | 'csv' = 'json') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/export?format=${format}`);
      return response.data;
    } catch (err) {
      setError('Erreur lors de l\'export des statistiques');
      console.error('Error exporting stats:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sauvegarder toutes les données
  const backupAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/stats/backup`);
      return response.data;
    } catch (err) {
      setError('Erreur lors de la sauvegarde des données');
      console.error('Error backing up data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialiser le hook
  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  return {
    globalStats,
    userStats,
    loading,
    error,
    setGlobalStats,
    setUserStats,
    fetchGlobalStats,
    fetchUserStats,
    fetchRangeStats,
    fetchTrainingHistory,
    fetchLeaderboard,
    fetchRangeProgress,
    exportStats,
    backupAllData,
  };
}
