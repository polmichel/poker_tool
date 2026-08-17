"""
Immutable poker deck value object (Elegant Objects).

The deck is a pure domain object that knows how to draw cards and exclude known
cards (hero + range combos) before running a simulation. It is free of any
external dependency: cards are represented as canonical 2-char strings
(e.g. ``"Ah"``), so the deck works with any evaluator adapter.
"""
import random


# Ranks and suits reused across the equity module (mirror of objects/hand.py).
RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
SUITS = ['s', 'h', 'd', 'c']


class Deck:
    """Immutable poker deck (52 cards) used for equity simulations."""

    def __init__(self, excluded: list[str] | None = None,
                 rng: random.Random | None = None) -> None:
        self._excluded = list(excluded) if excluded else []
        self._rng = rng or random.Random()

    @property
    def excluded(self) -> list[str]:
        """Cards removed from the deck (as 'Ah' strings)."""
        return list(self._excluded)

    def draw(self, count: int) -> list[str]:
        """Draw ``count`` cards as 2-char strings (e.g. 'Ah'), excluding known cards."""
        available = [
            f"{rank}{suit}"
            for rank in RANKS
            for suit in SUITS
            if f"{rank}{suit}" not in self._excluded
        ]
        if count > len(available):
            raise ValueError(
                f"Cannot draw {count} cards: only {len(available)} available"
            )
        self._rng.shuffle(available)
        return available[:count]

    def without(self, cards: list[str]) -> 'Deck':
        """Return a new deck excluding the given cards (immutable)."""
        return Deck(excluded=self._excluded + cards, rng=self._rng)
