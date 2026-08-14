import { useState, useEffect, useCallback, useRef } from 'react';
import { RangesApi } from '../api';
import { Range, ActionType } from '../types';

// Hook personnalisé pour gérer les ranges.
// Dépend de RangesApi (injectable) plutôt que d'appeler axios directement.
export function useRanges(rangesApi?: RangesApi) {
  const rangesApiRef = useRef<RangesApi>(rangesApi ?? new RangesApi());
  const api = rangesApiRef.current;
  const [ranges, setRanges] = useState<Range[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  // Charger toutes les ranges
  const fetchRanges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.all();
      setRanges(data);
    } catch (err) {
      setError('Erreur lors du chargement des ranges');
      console.error('Error fetching ranges:', err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Charger une range spécifique
  const fetchRange = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.byId(id);
        setSelectedRange(data);
        return data;
      } catch (err) {
        setError(`Erreur lors du chargement de la range ${id}`);
        console.error(`Error fetching range ${id}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Créer une nouvelle range
  const createRange = useCallback(
    async (rangeData: Omit<Range, 'id' | 'created_at' | 'updated_at'>) => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.create(rangeData);
        setRanges((prev) => [...prev, data]);
        return data;
      } catch (err) {
        setError('Erreur lors de la création de la range');
        console.error('Error creating range:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Mettre à jour une range
  const updateRange = useCallback(
    async (id: number, rangeData: Partial<Range>) => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.update(id, rangeData);
        setRanges((prev) => prev.map((r) => (r.id === id ? data : r)));
        if (selectedRange?.id === id) {
          setSelectedRange(data);
        }
        return data;
      } catch (err) {
        setError(`Erreur lors de la mise à jour de la range ${id}`);
        console.error(`Error updating range ${id}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [selectedRange, api],
  );

  // Supprimer une range
  const deleteRange = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        await api.remove(id);
        setRanges((prev) => prev.filter((r) => r.id !== id));
        if (selectedRange?.id === id) {
          setSelectedRange(null);
        }
        return true;
      } catch (err) {
        setError(`Erreur lors de la suppression de la range ${id}`);
        console.error(`Error deleting range ${id}:`, err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [selectedRange, api],
  );

  // Mettre à jour l'action d'une main dans une range
  const updateHandAction = useCallback(
    async (rangeId: number, handStr: string, action: ActionType) => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.updateHand(rangeId, handStr, action);
        setRanges((prev) => prev.map((r) => (r.id === rangeId ? data : r)));
        if (selectedRange?.id === rangeId) {
          setSelectedRange(data);
        }
        return data;
      } catch (err) {
        setError(`Erreur lors de la mise à jour de la main ${handStr}`);
        console.error(`Error updating hand ${handStr}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [selectedRange, api],
  );

  // Retirer une main d'une range
  const removeHandFromRange = useCallback(
    async (rangeId: number, handStr: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.removeHand(rangeId, handStr);
        setRanges((prev) => prev.map((r) => (r.id === rangeId ? data : r)));
        if (selectedRange?.id === rangeId) {
          setSelectedRange(data);
        }
        return data;
      } catch (err) {
        setError(`Erreur lors de la suppression de la main ${handStr}`);
        console.error(`Error removing hand ${handStr}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [selectedRange, api],
  );

  // Exporter une range
  const exportRange = useCallback(
    async (rangeId: number, format: 'json' | 'text' | 'csv' = 'json') => {
      setLoading(true);
      setError(null);

      try {
        return await api.exportRange(rangeId, format);
      } catch (err) {
        setError(`Erreur lors de l'export de la range ${rangeId}`);
        console.error(`Error exporting range ${rangeId}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Importer une range
  const importRange = useCallback(
    async (content: string, format: 'json' | 'text' | 'csv' = 'json') => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.importRange(content, format);
        setRanges((prev) => [...prev, data]);
        return data;
      } catch (err) {
        setError("Erreur lors de l'import de la range");
        console.error('Error importing range:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Obtenir les statistiques d'une range
  const getRangeStats = useCallback(
    async (rangeId: number) => {
      setLoading(true);
      setError(null);

      try {
        return await api.stats(rangeId);
      } catch (err) {
        setError(`Erreur lors du chargement des statistiques de la range ${rangeId}`);
        console.error(`Error fetching stats for range ${rangeId}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Obtenir la grille d'une range
  const getRangeGrid = useCallback(
    async (rangeId: number) => {
      setLoading(true);
      setError(null);

      try {
        return await api.grid(rangeId);
      } catch (err) {
        setError(`Erreur lors du chargement de la grille de la range ${rangeId}`);
        console.error(`Error fetching grid for range ${rangeId}:`, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  // Charger les ranges par défaut
  const fetchDefaultRanges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      return await api.defaultRanges();
    } catch (err) {
      setError('Erreur lors du chargement des ranges par défaut');
      console.error('Error fetching default ranges:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Initialiser le hook
  useEffect(() => {
    fetchRanges();
  }, [fetchRanges]);

  return {
    ranges,
    loading,
    error,
    selectedRange,
    setSelectedRange,
    fetchRanges,
    fetchRange,
    createRange,
    updateRange,
    deleteRange,
    updateHandAction,
    removeHandFromRange,
    exportRange,
    importRange,
    getRangeStats,
    getRangeGrid,
    fetchDefaultRanges,
  };
}
