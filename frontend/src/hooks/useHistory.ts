/**
 * Generic undo/redo history hook.
 *
 * Extracts the duplicated history management that lived inline in
 * RangeEditor (and could reappear in any grid-based editor). Owns the
 * history stack, the current index and the current value; callers express
 * intentions (push, undo, redo, reset) instead of mutating arrays by hand.
 */
import { useState, useCallback } from 'react';

export interface History<T> {
  current: T | null;
  canUndo: boolean;
  canRedo: boolean;
  /** Reset the history to a single entry (becomes the current value). */
  reset: (value: T) => void;
  /** Push a new value after the current index (drops any redo tail). */
  push: (value: T) => void;
  /** Move one step back; returns nothing (read `current`). */
  undo: () => void;
  /** Move one step forward. */
  redo: () => void;
}

export function useHistory<T>(initial: T[] = []): History<T> {
  const [stack, setStack] = useState<T[]>(initial);
  const [index, setIndex] = useState<number>(initial.length > 0 ? 0 : -1);

  const current = index >= 0 && index < stack.length ? stack[index] : null;

  const reset = useCallback((value: T) => {
    setStack([value]);
    setIndex(0);
  }, []);

  const push = useCallback(
    (value: T) => {
      setStack((prev) => {
        const base = prev.slice(0, index + 1);
        return [...base, value];
      });
      setIndex((prev) => prev + 1);
    },
    [index],
  );

  const undo = useCallback(() => {
    setIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const redo = useCallback(() => {
    setIndex((prev) => (prev < stack.length - 1 ? prev + 1 : prev));
  }, [stack.length]);

  return {
    current,
    canUndo: index > 0,
    canRedo: index < stack.length - 1,
    reset,
    push,
    undo,
    redo,
  };
}
