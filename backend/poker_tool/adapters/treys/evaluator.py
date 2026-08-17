"""
treys hand evaluator adapter (Elegant Objects).

Concrete implementation of the :class:`HandEvaluator` port backed by the
``treys`` library. This is the ONLY place that knows about treys — the equity
use case and the deck depend solely on the port, so swapping to another
evaluator (PokerKit, a custom one, ...) only requires adding a new adapter.
"""
import treys

from ...interfaces.hand_evaluator import HandEvaluator


class TreysEvaluator(HandEvaluator):
    """HandEvaluator backed by the treys library."""

    def __init__(self) -> None:
        self._evaluator = treys.Evaluator()

    def evaluate(self, hole_cards: list[str], board: list[str]) -> int:
        """Evaluate hole + board (7 cards) and return a treys rank (lower = better)."""
        hole_ints = [treys.Card.new(c) for c in hole_cards]
        board_ints = [treys.Card.new(c) for c in board]
        return self._evaluator.evaluate(hole_ints, board_ints)
