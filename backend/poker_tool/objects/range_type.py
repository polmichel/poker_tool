"""
Immutable range type value object (Elegant Objects).
"""
from enum import Enum, auto


class RangeType(Enum):
    """Types of poker ranges."""
    PREFLOP = auto()
    POSTFLOP = auto()
    PUSH_FOLD = auto()

    @property
    def label(self) -> str:
        """Human-readable label."""
        labels = {
            RangeType.PREFLOP: "Preflop",
            RangeType.POSTFLOP: "Postflop",
            RangeType.PUSH_FOLD: "Push/Fold",
        }
        return labels[self]

    @property
    def description(self) -> str:
        """Description of the range type."""
        descriptions = {
            RangeType.PREFLOP: "Range utilisée avant le flop",
            RangeType.POSTFLOP: "Range utilisée après le flop",
            RangeType.PUSH_FOLD: "Range pour les situations push/fold (tournois)",
        }
        return descriptions[self]

    @classmethod
    def from_string(cls, range_type_str: str) -> 'RangeType':
        """Factory method from string."""
        try:
            return RangeType[range_type_str.upper()]
        except KeyError:
            return RangeType.PREFLOP
