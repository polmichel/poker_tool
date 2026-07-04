"""
Domain objects for Poker Hands (Elegant Objects principles).
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import List, Dict, Tuple


# Poker ranks in order (Ace to 2)
RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']


class ActionType(Enum):
    """Possible actions for a hand in a range."""
    OPEN = auto()
    RAISE = auto()
    CALL = auto()
    FOLD = auto()
    ALL_IN = auto()
    UNDEFINED = auto()


@dataclass(frozen=True)
class Hand:
    """Immutable representation of a poker hand."""
    rank1: str
    rank2: str
    suited: bool
    
    @property
    def to_string(self) -> str:
        """Convert hand to standard string representation."""
        if self.rank1 == self.rank2:
            return f"{self.rank1}{self.rank1}"
        return f"{self.rank1}{self.rank2}{"s" if self.suited else "o"}"
    
    @classmethod
    def from_string(cls, hand_str: str) -> 'Hand':
        """Create a Hand from string representation."""
        hand_str = hand_str.upper()
        if len(hand_str) == 2:
            return cls(hand_str[0], hand_str[1], False)
        elif len(hand_str) == 3 and hand_str[2] == 'S':
            return cls(hand_str[0], hand_str[1], True)
        elif len(hand_str) == 3 and hand_str[2] == 'O':
            return cls(hand_str[0], hand_str[1], False)
        else:
            raise ValueError(f"Invalid hand string: {hand_str}")
    
    def __lt__(self, other: 'Hand') -> bool:
        """Compare hands by rank."""
        rank1_idx = RANKS.index(self.rank1)
        rank2_idx = RANKS.index(self.rank2)
        other_rank1_idx = RANKS.index(other.rank1)
        other_rank2_idx = RANKS.index(other.rank2)
        
        # Compare highest rank first
        if rank1_idx != other_rank1_idx:
            return rank1_idx < other_rank1_idx
        return rank2_idx < other_rank2_idx


def generate_all_hands() -> List[Hand]:
    """Generate all possible poker hands (13x13 = 169 combinations)."""
    hands = []
    for i, rank1 in enumerate(RANKS):
        for j, rank2 in enumerate(RANKS):
            if i <= j:
                suited = (i == j)  # Pairs are always suited
                hands.append(Hand(rank1, rank2, suited))
    return hands


def generate_all_hands_dict() -> Dict[str, ActionType]:
    """Generate all possible poker hands as a dictionary."""
    from .range import ActionType
    hands = {}
    for hand in generate_all_hands():
        hands[hand.to_string] = ActionType.UNDEFINED
    return hands
