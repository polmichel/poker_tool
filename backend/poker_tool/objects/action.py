"""
Immutable action value object (Elegant Objects).
"""
from enum import Enum, auto


class ActionType(Enum):
    """Action types."""
    OPEN = auto()
    RAISE = auto()
    CALL = auto()
    FOLD = auto()
    ALL_IN = auto()
    UNDEFINED = auto()


class Action:
    """Immutable action value object."""

    def __init__(self, action_type: ActionType):
        self._type = action_type

    @property
    def type(self) -> ActionType:
        """Action type."""
        return self._type

    @property
    def color(self) -> str:
        """Color associated with this action."""
        colors = {
            ActionType.OPEN: "#4CAF50",
            ActionType.RAISE: "#2196F3",
            ActionType.CALL: "#FF9800",
            ActionType.FOLD: "#F44336",
            ActionType.ALL_IN: "#9C27B0",
            ActionType.UNDEFINED: "#607D8B",
        }
        return colors[self._type]

    @property
    def label(self) -> str:
        """Human-readable label."""
        labels = {
            ActionType.OPEN: "Ouvrir",
            ActionType.RAISE: "Relancer",
            ActionType.CALL: "Suivre",
            ActionType.FOLD: "Passer",
            ActionType.ALL_IN: "All-In",
            ActionType.UNDEFINED: "Non défini",
        }
        return labels[self._type]

    def __str__(self) -> str:
        """String representation."""
        return self._type.name.lower()

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, Action):
            return False
        return self._type == other._type

    def __hash__(self) -> int:
        """Hash for use in sets/dicts."""
        return hash(self._type)

    @classmethod
    def from_string(cls, action_str: str) -> 'Action':
        """Factory method from string."""
        try:
            action_type = ActionType[action_str.upper()]
        except KeyError:
            action_type = ActionType.UNDEFINED
        return cls(action_type)
