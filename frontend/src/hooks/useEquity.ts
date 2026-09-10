import { useState, useCallback, useRef } from 'react';
import { useAsyncState } from './useAsyncState';
import { extractErrorMessage } from '../utils/errors';
import { EquityApi, EquityMissingError } from '../api';
import { EquityResult } from '../types';

// Hook personnalise pour gerer la simulation d'equite.
// Depend de EquityApi (injectable) plutôt que d'appeler axios directement.
//
// Par defaut, simulate() appelle le chemin exact (sans iterations). Si la
// table exacte est incomplete, l'API leve EquityMissingError (409) portant la
// liste des mains manquantes : le hook la propage afin que la page puisse
// ouvrir la pop-up proposant de lancer un Monte-Carlo (avec iterations).
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
        // EquityMissingError est propagee telle quelle pour que la page
        // puisse ouvrir la pop-up de Monte-Carlo ; les autres erreurs
        // deviennent un message utilisateur classique.
        if (err instanceof EquityMissingError) {
          setError(null);
          throw err;
        }
        setError(extractErrorMessage(err, "Erreur lors du calcul de l'equite", true));
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
