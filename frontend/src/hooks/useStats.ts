import { useState, useEffect, useCallback, useRef } from 'react';
import { StatsApi, GlobalStats, UserStats } from '../api';

// Hook personnalisé pour gérer les statistiques.
// Dépend de StatsApi (injectable). L'état interne reste privé : l'UI n'a accès
// qu'aux intentions (fetchGlobalStats, fetchUserStats, ...) — pas aux setters.
export function useStats(statsApi?: StatsApi) {
  const statsApiRef = useRef<StatsApi>(statsApi ?? new StatsApi());
  const api = statsApiRef.current;
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques globales
  const fetchGlobalStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.global();
      setGlobalStats(data);
      return data;
    } catch (err) {
      setError('Erreur lors du chargement des statistiques globales');
      console.error('Error fetching global stats:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Charger les statistiques d'un utilisateur
  const fetchUserStats = useCallback(
    async (userId: number) => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.byUser(userId);
        setUserStats(data);
        return data;
      } catch (err) {
        setError(`Erreur lors du chargement des statistiques de l'utilisateur ${userId}`);
        console.error(`Error fetching user stats for ${userId}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Charger les statistiques d'une range
  const fetchRangeStats = useCallback(
    async (rangeId: number) => {
      setLoading(true);
      setError(null);

      try {
        return await api.byRange(rangeId);
      } catch (err) {
        setError(`Erreur lors du chargement des statistiques de la range ${rangeId}`);
        console.error(`Error fetching range stats for ${rangeId}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Charger l'historique des sessions
  const fetchTrainingHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      return await api.history();
    } catch (err) {
      setError("Erreur lors du chargement de l'historique des sessions");
      console.error('Error fetching training history:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Charger le classement
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      return await api.leaderboard();
    } catch (err) {
      setError('Erreur lors du chargement du classement');
      console.error('Error fetching leaderboard:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Charger la progression pour une range
  const fetchRangeProgress = useCallback(
    async (rangeId: number) => {
      setLoading(true);
      setError(null);

      try {
        return await api.rangeProgress(rangeId);
      } catch (err) {
        setError(`Erreur lors du chargement de la progression de la range ${rangeId}`);
        console.error(`Error fetching range progress for ${rangeId}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Exporter les statistiques
  const exportStats = useCallback(
    async (format: 'json' | 'csv' = 'json') => {
      setLoading(true);
      setError(null);

      try {
        return await api.export(format);
      } catch (err) {
        setError("Erreur lors de l'export des statistiques");
        console.error('Error exporting stats:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Sauvegarder toutes les données
  const backupAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      return await api.backup();
    } catch (err) {
      setError('Erreur lors de la sauvegarde des données');
      console.error('Error backing up data:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Initialiser le hook
  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  return {
    globalStats,
    userStats,
    loading,
    error,
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
