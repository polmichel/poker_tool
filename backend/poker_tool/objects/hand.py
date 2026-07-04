"""
Immutable poker hand value object (Elegant Objects).
"""

# Poker ranks in order (Ace to 2)
RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']


class Hand:
    """Immutable poker hand value object."""

    def __init__(self, rank1: str, rank2: str, suited: bool):
        self._rank1 = rank1.upper()
        self._rank2 = rank2.upper()
        self._suited = suited

    @property
    def rank1(self) -> str:
        """First rank."""
        return self._rank1

    @property
    def rank2(self) -> str:
        """Second rank."""
        return self._rank2

    @property
    def suited(self) -> bool:
        """Is suited."""
        return self._suited

    @property
    def is_pair(self) -> bool:
        """Is a pair."""
        return self._rank1 == self._rank2

    def __str__(self) -> str:
        """String representation (e.g., 'AKs', 'TT')."""
        if self.is_pair:
            return f"{self._rank1}{self._rank1}"
        return f"{self._rank1}{self._rank2}{'s' if self._suited else 'o'}"

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, Hand):
            return False
        return (
            self._rank1 == other._rank1 and
            self._rank2 == other._rank2 and
            self._suited == other._suited
        )

    def __hash__(self) -> int:
        """Hash for use in sets/dicts."""
        return hash((self._rank1, self._rank2, self._suited))

    @classmethod
    def from_string(cls, hand_str: str) -> 'Hand':
        """Factory method from string."""
        hand_str = hand_str.upper()
        if len(hand_str) == 2:
            return cls(hand_str[0], hand_str[1], False)
        elif len(hand_str) == 3:
            return cls(hand_str[0], hand_str[1], hand_str[2] == 'S')
        else:
            raise ValueError(f"Invalid hand string: {hand_str}")

    def __lt__(self, other: 'Hand') -> bool:
        """Compare hands by rank."""
        rank1_idx = RANKS.index(self._rank1)
        rank2_idx = RANKS.index(self._rank2)
        other_rank1_idx = RANKS.index(other._rank1)
        other_rank2_idx = RANKS.index(other._rank2)
        
        # Compare highest rank first
        if rank1_idx != other_rank1_idx:
            return rank1_idx < other_rank1_idx
        return rank2_idx < other_rank2_idx


def generate_all_hands() -> list:
    """Generate all possible poker hands (13x13 = 169 combinations)."""
    hands = []
    for i, rank1 in enumerate(RANKS):
        for j, rank2 in enumerate(RANKS):
            if i <= j:
                suited = (i == j)  # Pairs are always suited
                hands.append(Hand(rank1, rank2, suited))
    return hands
