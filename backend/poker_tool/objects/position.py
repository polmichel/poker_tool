"""
Immutable position value object (Elegant Objects).
"""
from enum import Enum, auto


class Position(Enum):
    """Table positions in poker."""

    UTG = auto()
    UTG_PLUS_1 = auto()
    LJ = auto()
    HJ = auto()
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
            Position.UTG_PLUS_1: "UTG+1",
            Position.LJ: "LJ",
            Position.HJ: "HJ",
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
            Position.UTG_PLUS_1: "#FF7043",
            Position.LJ: "#FF9800",
            Position.HJ: "#FFC107",
            Position.CO: "#FFE0B2",
            Position.BTN: "#4CAF50",
            Position.SB: "#2196F3",
            Position.BB: "#9C27B0",
            Position.UNDEFINED: "#607D8B",
        }
        return colors[self]

    @classmethod
    def from_string(cls, position_str: str) -> 'Position':
        """Factory method from string."""
        # Map common string representations to enum names
        string_to_enum = {
            "UTG": "UTG",
            "UTG+1": "UTG_PLUS_1",
            "LJ": "LJ",
            "HJ": "HJ",
            "CO": "CO",
            "BTN": "BTN",
            "SB": "SB",
            "BB": "BB",
        }

        # Try to normalize the input string
        normalized = position_str.upper().replace("+", "_PLUS_").replace("1", "_1")

        # Try direct enum access first
        try:
            return Position[normalized]
        except KeyError:
            pass

        # Try with the string mapping
        try:
            enum_name = string_to_enum[position_str.upper()]
            return Position[enum_name]
        except KeyError:
            pass

        # Try with normalized string
        try:
            return Position[position_str.upper()]
        except KeyError:
            return Position.UNDEFINED
