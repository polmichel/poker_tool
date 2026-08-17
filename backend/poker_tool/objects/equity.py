"""
Immutable equity result value object (Elegant Objects).

Holds the aggregated win/tie/lose of a hero hand against an opposing range,
plus the per-hand breakdown used by the frontend heatmap and detail table.
"""

from .hand import RANKS


def hand_combos(rank1: str, rank2: str, suited: bool) -> int:
    """Number of real-card combos for a canonical hand (169 grid cell)."""
    if rank1 == rank2:
        # Pocket pair: C(4,2) = 6 combos.
        return 6
    return 4 if suited else 12


class EquityByHand:
    """Equity of the hero hand against a single opposing hand."""

    def __init__(self, hand: str, combos: int,
                 win: float, tie: float, lose: float) -> None:
        self._hand = hand
        self._combos = combos
        self._win = win
        self._tie = tie
        self._lose = lose

    @property
    def hand(self) -> str:
        """Canonical hand notation (e.g. 'AKs', 'TT')."""
        return self._hand

    @property
    def combos(self) -> int:
        """Number of real-card combinations for this hand."""
        return self._combos

    @property
    def win(self) -> float:
        """Win percentage."""
        return self._win

    @property
    def tie(self) -> float:
        """Tie percentage."""
        return self._tie

    @property
    def lose(self) -> float:
        """Lose percentage."""
        return self._lose

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            "hand": self._hand,
            "combos": self._combos,
            "win": round(self._win, 2),
            "tie": round(self._tie, 2),
            "lose": round(self._lose, 2),
        }


class EquityResult:
    """Aggregated equity of a hero hand against an opposing range."""

    def __init__(self, hero: str, win: float, tie: float, lose: float,
                 iterations: int, by_hand: list[EquityByHand]) -> None:
        self._hero = hero
        self._win = win
        self._tie = tie
        self._lose = lose
        self._iterations = iterations
        self._by_hand = list(by_hand)

    @property
    def hero(self) -> str:
        """Hero hand notation."""
        return self._hero

    @property
    def win(self) -> float:
        """Aggregated win percentage."""
        return self._win

    @property
    def tie(self) -> float:
        """Aggregated tie percentage."""
        return self._tie

    @property
    def lose(self) -> float:
        """Aggregated lose percentage."""
        return self._lose

    @property
    def iterations(self) -> int:
        """Number of Monte-Carlo iterations."""
        return self._iterations

    @property
    def by_hand(self) -> list[EquityByHand]:
        """Per-hand equity breakdown."""
        return list(self._by_hand)

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            "hero": self._hero,
            "win": round(self._win, 2),
            "tie": round(self._tie, 2),
            "lose": round(self._lose, 2),
            "iterations": self._iterations,
            "by_hand": [h.to_dict() for h in self._by_hand],
        }
