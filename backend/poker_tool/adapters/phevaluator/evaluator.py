"""
phevaluator hand evaluator adapter (Elegant Objects).

Concrete implementation of the :class:`HandEvaluator` port backed by the
``phevaluator`` library (C++ under the hood, ~3-4x faster than ``treys``).
This is the adapter used by :class:`EnumerateEquity` to make the exhaustive
preflop enumeration tractable.

Like the treys adapter, this is the ONLY place that knows about phevaluator —
the equity use cases depend solely on the port, so swapping evaluators only
requires injecting a different adapter.
"""
import phevaluator

from ...interfaces.hand_evaluator import HandEvaluator


class Phevaluator(HandEvaluator):
    """HandEvaluator backed by the phevaluator library."""

    def __init__(self) -> None:
        # Pre-build the card-string -> int id map once (phevaluator accepts
        # int card ids, which avoids per-call string parsing in hot loops).
        self._card_ids: dict[str, int] = {}
        for r in "AKQJT98765432":
            for s in "shdc":
                self._card_ids[f"{r}{s}"] = int(phevaluator.Card(f"{r}{s}"))

    def evaluate(self, hole_cards: list[str], board: list[str]) -> int:
        """Evaluate hole + board (7 cards) and return a rank (lower = better)."""
        cards = [self._card_ids[c] for c in hole_cards] + \
                [self._card_ids[c] for c in board]
        return phevaluator.evaluate_cards(*cards)
