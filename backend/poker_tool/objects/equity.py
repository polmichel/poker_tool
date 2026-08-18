"""
Immutable equity result value object (Elegant Objects).

Holds the aggregated win/tie/lose of a hero hand against an opposing range,
plus the per-hand breakdown used by the frontend heatmap and detail table.
"""


SUITS = ["s", "h", "d", "c"]


def hand_combos(rank1: str, rank2: str, suited: bool) -> int:
    """Number of real-card combos for a canonical hand (169 grid cell)."""
    if rank1 == rank2:
        # Pocket pair: C(4,2) = 6 combos.
        return 6
    return 4 if suited else 12


def available_combos(
    rank1: str, rank2: str, suited: bool, hero_cards: set[str]
) -> int:
    """Number of real-card combos still possible given the hero's hole cards.

    Unlike :func:`hand_combos` (raw 6/4/12), this excludes combos that share a
    card with the hero. For example, hero ``AhKh`` facing ``AKs``: only 3 suited
    combos remain (the Ah is taken), not 4. This is the weight used when
    aggregating an exact per-hand equity table against a range, so the
    aggregate reflects the combos that can actually be dealt.
    """
    if rank1 == rank2:  # pocket pair: C(4,2) minus combos using a hero card
        count = 0
        for i in range(len(SUITS)):
            for j in range(i + 1, len(SUITS)):
                if f"{rank1}{SUITS[i]}" in hero_cards:
                    continue
                if f"{rank1}{SUITS[j]}" in hero_cards:
                    continue
                count += 1
        return count
    if suited:  # 4 suited combos, minus those using a hero card
        count = 0
        for s in SUITS:
            if f"{rank1}{s}" in hero_cards or f"{rank2}{s}" in hero_cards:
                continue
            count += 1
        return count
    # Offsuit: 12 combos (distinct suits), minus those using a hero card.
    count = 0
    for i in range(len(SUITS)):
        for j in range(len(SUITS)):
            if i == j:
                continue
            if f"{rank1}{SUITS[i]}" in hero_cards or f"{rank2}{SUITS[j]}" in hero_cards:
                continue
            count += 1
    return count


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
