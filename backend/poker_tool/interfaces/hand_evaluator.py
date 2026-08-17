"""
Hand evaluator port (Elegant Objects).

A single-responsibility port for evaluating poker hands. The equity use case
depends on this abstraction rather than on any concrete library (e.g. ``treys``),
so the evaluation backend can be swapped (treys -> PokerKit -> a custom
evaluator) without touching the use case.

Cards are passed as canonical 2-char strings (e.g. ``"Ah"``) so the port is
free of any library-specific card representation.
"""
from abc import ABC, abstractmethod


class HandEvaluator(ABC):
    """Abstract port for evaluating 7-card poker hands."""

    @abstractmethod
    def evaluate(self, hole_cards: list[str], board: list[str]) -> int:
        """Return a rank for the best 5-card hand among hole + board.

        Lower is better (standard convention). The returned value is only
        meaningful for comparison against other values produced by the same
        evaluator; callers must not interpret the integer itself.
        """
