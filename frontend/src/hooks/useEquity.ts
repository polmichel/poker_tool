import { useState, useCallback, useRef } from 'react';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';
import { EquityApi } from '../api';
import { EquityResult } from '../types';

// Hook personnalisé pour gérer la simulation d'équité.
// Dépend de EquityApi (injectable) plutôt que d'appeler axios directement.
export function useEquity(equityApi?: EquityApi) {
  const equityApiRef = useRef<EquityApi>(equityApi ?? new EquityApi());
  const api = equityApiRef.current;

  const [result, setResult] = useState<EquityResult | null>(null);
  const { loading, error, run, setError } = useAsyncState(false);

  const simulate = useCallback(
    async (hero: string, range: string, iterations: number = 10000) => {
      try {
        const data = await run(() => api.simulate(hero, range, iterations));
        setResult(data);
        return data;
      } catch (err) {
        setError(extractErrorMessage(err, "Erreur lors du calcul de l'équité", true));
        return null;
      }
    },
    [api, run, setError],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, [setError]);

  return { result, loading, error, simulate, reset };
}
