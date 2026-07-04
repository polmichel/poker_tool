"""
Immutable position value object (Elegant Objects).
"""
from enum import Enum, auto


class Position(Enum):
    """Table positions in poker."""
    UTG = auto()
    MP = auto()
    CO = auto()
    BTN = auto()
    SB = auto()
    BB = auto()
    UNDEFINED = auto()

    @property
    def label(self) -> str:
        """Human-readable label."""
        labels = {
            Position.UTG: "UTG",
            Position.MP: "MP",
            Position.CO: "CO",
            Position.BTN: "BTN",
            Position.SB: "SB",
            Position.BB: "BB",
            Position.UNDEFINED: "Non défini",
        }
        return labels[self]

    @property
    def color(self) -> str:
        """Color associated with this position."""
        colors = {
            Position.UTG: "#FF5722",
            Position.MP: "#FF9800",
            Position.CO: "#FFC107",
            Position.BTN: "#4CAF50",
            Position.SB: "#2196F3",
            Position.BB: "#9C27B0",
            Position.UNDEFINED: "#607D8B",
        }
        return colors[self]

    @classmethod
    def from_string(cls, position_str: str) -> 'Position':
        """Factory method from string."""
        try:
            return Position[position_str.upper()]
        except KeyError:
            return Position.UNDEFINED
