import { useState, useEffect, useCallback, useRef } from 'react';
import { StatsApi, GlobalStats, UserStats } from '../api';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';

// Hook personnalisé pour gérer les statistiques.
// Dépend de StatsApi (injectable). L'état interne reste privé : l'UI n'a accès
// qu'aux intentions (fetchGlobalStats, fetchUserStats, ...) — pas aux setters.
export function useStats(statsApi?: StatsApi) {
  const statsApiRef = useRef<StatsApi>(statsApi ?? new StatsApi());
  const api = statsApiRef.current;
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const { loading, error, run, setError } = useAsyncState(true);

  // Charger les statistiques globales
  const fetchGlobalStats = useCallback(async () => {
    try {
      const data = await run(() => api.global());
      setGlobalStats(data);
      return data;
    } catch (err) {
      setError(extractErrorMessage(err, 'Erreur lors du chargement des statistiques globales'));
      console.error('Error fetching global stats:', err);
      return null;
    }
  }, [api, run, setError]);

  // Charger les statistiques d'un utilisateur
  const fetchUserStats = useCallback(
    async (userId: number) => {
      try {
        const data = await run(() => api.byUser(userId));
        setUserStats(data);
        return data;
      } catch (err) {
        setError(
          extractErrorMessage(
            err,
            `Erreur lors du chargement des statistiques de l'utilisateur ${userId}`,
          ),
        );
        console.error(`Error fetching user stats for ${userId}:`, err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Charger l'historique des sessions
  const fetchTrainingHistory = useCallback(async () => {
    try {
      return await run(() => api.history());
    } catch (err) {
      setError(extractErrorMessage(err, "Erreur lors du chargement de l'historique des sessions"));
      console.error('Error fetching training history:', err);
      return null;
    }
  }, [api, run, setError]);

  // Charger le classement
  const fetchLeaderboard = useCallback(async () => {
    try {
      return await run(() => api.leaderboard());
    } catch (err) {
      setError(extractErrorMessage(err, 'Erreur lors du chargement du classement'));
      console.error('Error fetching leaderboard:', err);
      return null;
    }
  }, [api, run, setError]);

  // Exporter les statistiques
  const exportStats = useCallback(
    async (format: 'json' | 'csv' = 'json') => {
      try {
        return await run(() => api.export(format));
      } catch (err) {
        setError(extractErrorMessage(err, "Erreur lors de l'export des statistiques"));
        console.error('Error exporting stats:', err);
        return null;
      }
    },
    [api, run, setError],
  );

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
    fetchTrainingHistory,
    fetchLeaderboard,
    exportStats,
  };
}
