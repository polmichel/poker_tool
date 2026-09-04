/**
 * useTrainingModes - Manages training modes
 *
 * This hook handles:
 * - Fetching available training modes
 *
 * @hook
 */
import { useState, useCallback, useRef } from 'react';
import { TrainingApi } from '../api';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';

export interface UseTrainingModesReturn {
  modes: Array<{ value: string; label: string }>;
  loading: boolean;
  error: string | null;
  fetchTrainingModes: () => Promise<Array<{ value: string; label: string }> | null>;
}

/**
 * Hook for managing training modes
 */
export function useTrainingModes(trainingApi?: TrainingApi): UseTrainingModesReturn {
  const apiRef = useRef<TrainingApi>(trainingApi ?? new TrainingApi());
  const api = apiRef.current;

  // State
  const [modes, setModes] = useState<Array<{ value: string; label: string }>>([]);
  const { loading, error, run, setError } = useAsyncState(true);

  // Fetch training modes
  const fetchTrainingModes = useCallback(async () => {
    try {
      const data = await run(() => api.modes());
      setModes(data);
      return data;
    } catch (err) {
      setError(extractErrorMessage(err, "Erreur lors du chargement des modes d'entraînement"));
      console.error('Error fetching training modes:', err);
      return null;
    }
  }, [api, run, setError]);

  return {
    modes,
    loading,
    error,
    fetchTrainingModes,
  };
}
