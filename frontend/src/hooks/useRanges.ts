import { useState, useEffect, useCallback, useRef } from 'react';
import { RangesApi } from '../api';
import { Range } from '../types';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';

// Hook personnalisé pour gérer les ranges.
// Dépend de RangesApi (injectable) plutôt que d'appeler axios directement.
export function useRanges(rangesApi?: RangesApi, autoFetch: boolean = true) {
  const rangesApiRef = useRef<RangesApi>(rangesApi ?? new RangesApi());
  const api = rangesApiRef.current;

  const [ranges, setRanges] = useState<Range[]>([]);
  // loading commence à false pour ne pas afficher prématurément un état
  // « Chargement... » / « Range non trouvée » quand le hook est monté dans un
  // composant qui n'a pas besoin de la liste (ex: RangeEditor). Chaque appel
  // explicite (fetchRanges, fetchRange, etc.) met loading à true le temps
  // de l'opération.
  const { loading, error, run, setError } = useAsyncState(false);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  // Charger toutes les ranges
  const fetchRanges = useCallback(async () => {
    try {
      const data = await run(() => api.all());
      setRanges(data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Erreur lors du chargement des ranges'));
      console.error('Error fetching ranges:', err);
    }
  }, [api, run, setError]);

  // Charger une range spécifique
  const fetchRange = useCallback(
    async (id: number) => {
      try {
        const data = await run(() => api.byId(id));
        setSelectedRange(data);
        return data;
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors du chargement de la range ${id}`));
        console.error(`Error fetching range ${id}:`, err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Créer une nouvelle range
  const createRange = useCallback(
    async (rangeData: Omit<Range, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const data = await run(() => api.create(rangeData));
        setRanges((prev) => [...prev, data]);
        // Sélectionner immédiatement la range nouvellement créée afin que le
        // RangeEditor puisse l'afficher sans attendre un fetchRange supplémentaire.
        // Cela évite le bug « Range non trouvée » juste après la création.
        setSelectedRange(data);
        return data;
      } catch (err) {
        setError(extractErrorMessage(err, 'Erreur lors de la création de la range'));
        console.error('Error creating range:', err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Mettre à jour une range
  const updateRange = useCallback(
    async (id: number, rangeData: Partial<Range>) => {
      try {
        const data = await run(() => api.update(id, rangeData));
        setRanges((prev) => prev.map((r) => (r.id === id ? data : r)));
        if (selectedRange?.id === id) {
          setSelectedRange(data);
        }
        return data;
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors de la mise à jour de la range ${id}`));
        console.error(`Error updating range ${id}:`, err);
        return null;
      }
    },
    [selectedRange, api, run, setError],
  );

  // Supprimer une range
  const deleteRange = useCallback(
    async (id: number) => {
      try {
        await run(() => api.remove(id));
        setRanges((prev) => prev.filter((r) => r.id !== id));
        if (selectedRange?.id === id) {
          setSelectedRange(null);
        }
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors de la suppression de la range ${id}`));
        console.error(`Error deleting range ${id}:`, err);
        return false;
      }
    },
    [selectedRange, api, run, setError],
  );

  // Exporter une range
  const exportRange = useCallback(
    async (rangeId: number, format: 'json' | 'text' | 'csv' = 'json') => {
      try {
        return await run(() => api.exportRange(rangeId, format));
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors de l'export de la range ${rangeId}`));
        console.error(`Error exporting range ${rangeId}:`, err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Importer une range
  const importRange = useCallback(
    async (content: string, format: 'json' | 'text' | 'csv' = 'json') => {
      try {
        const data = await run(() => api.importRange(content, format));
        setRanges((prev) => [...prev, data]);
        return data;
      } catch (err) {
        setError(extractErrorMessage(err, "Erreur lors de l'import de la range"));
        console.error('Error importing range:', err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Obtenir les statistiques d'une range
  const getRangeStats = useCallback(
    async (rangeId: number) => {
      try {
        return await run(() => api.stats(rangeId));
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors du chargement des statistiques de la range ${rangeId}`));
        console.error(`Error fetching stats for range ${rangeId}:`, err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Obtenir la grille d'une range
  const getRangeGrid = useCallback(
    async (rangeId: number) => {
      try {
        return await run(() => api.grid(rangeId));
      } catch (err) {
        setError(extractErrorMessage(err, `Erreur lors du chargement de la grille de la range ${rangeId}`));
        console.error(`Error fetching grid for range ${rangeId}:`, err);
        return null;
      }
    },
    [api, run, setError],
  );

  // Charger toutes les ranges au montage uniquement si autoFetch est vrai.
  // Les pages comme RangeEditor qui n'ont pas besoin de la liste passent
  // autoFetch=false pour éviter un fetch inutile qui masquerait le
  // chargement de la range ciblée.
  useEffect(() => {
    if (autoFetch) {
      fetchRanges();
    }
  }, [fetchRanges, autoFetch]);

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
    exportRange,
    importRange,
    getRangeStats,
    getRangeGrid,
  };
}
