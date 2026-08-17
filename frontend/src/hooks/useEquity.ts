import { useState, useCallback, useRef } from 'react';
import { EquityApi } from '../api';
import { EquityResult } from '../types';

// Hook personnalisé pour gérer la simulation d'équité.
// Dépend de EquityApi (injectable) plutôt que d'appeler axios directement.
export function useEquity(equityApi?: EquityApi) {
  const equityApiRef = useRef<EquityApi>(equityApi ?? new EquityApi());
  const api = equityApiRef.current;

  const [result, setResult] = useState<EquityResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = useCallback(
    async (hero: string, range: string, iterations: number = 10000) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.simulate(hero, range, iterations);
        setResult(data);
        return data;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Erreur lors du calcul de l'équité";
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return { result, loading, error, simulate, reset };
}
