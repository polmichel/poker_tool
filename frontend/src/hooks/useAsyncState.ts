/**
 * Shared async state for hooks.
 *
 * Removes the ~30x duplicated `setLoading(true); setError(null); try {...}
 * finally { setLoading(false) }` boilerplate across the data hooks. Each hook
 * keeps its own domain state; this only owns the generic loading/error pair
 * and exposes a `run` helper that wraps an async operation.
 */
import { useCallback, useState } from 'react';

export interface AsyncState {
  loading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  /** Wrap an async operation: toggles loading, clears error, captures failures. */
  run: <T>(operation: () => Promise<T>) => Promise<T>;
}

export function useAsyncState(initialLoading: boolean = false): AsyncState {
  const [loading, setLoading] = useState<boolean>(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    try {
      return await operation();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, setLoading, setError, run };
}
