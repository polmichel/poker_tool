import { useState, useCallback, useRef } from 'react';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';
import { EquityApi, EquityMissingError } from '../api';
import { EquityResult } from '../types';

// Hook personnalisé pour gérer la simulation d'équité.
// Dépend de EquityApi (injectable) plutôt que d'appeler axios directement.
//
// Par défaut, simulate() appelle le chemin exact (sans itérations). Si la
// table exacte est incomplète, l'API lève EquityMissingError (409) portant la
// liste des mains manquantes : le hook la propage afin que la page puisse
// ouvrir la pop-up proposant de lancer un Monte-Carlo (avec itérations).
export function useEquity(equityApi?: EquityApi) {
  const equityApiRef = useRef<EquityApi>(equityApi ?? new EquityApi());
  const api = equityApiRef.current;

  const [result, setResult] = useState<EquityResult | null>(null);
  const { loading, error, run, setError } = useAsyncState(false);

  const simulate = useCallback(
    async (hero: string, range: string, iterations?: number) => {
      try {
        const data = await run(() => api.simulate(hero, range, iterations));
        setResult(data);
        return data;
      } catch (err) {
        // EquityMissingError est propagée telle quelle pour que la page
        // puisse ouvrir la pop-up de Monte-Carlo ; les autres erreurs
        // deviennent un message utilisateur classique.
        if (err instanceof EquityMissingError) {
          setError(null);
          throw err;
        }
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
