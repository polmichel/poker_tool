"""
Immutable effective stack value object (Elegant Objects).
"""

from enum import Enum

# Valeurs de stack effectif en BB (Big Blinds)
EFFECTIVE_STACK_VALUES = [
    50, 100, 30, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10,
    9, 8, 7, 6, 5
]


class EffectiveStack(Enum):
    """Effective stack sizes in BB."""

    BB_5 = 5
    BB_6 = 6
    BB_7 = 7
    BB_8 = 8
    BB_9 = 9
    BB_10 = 10
    BB_11 = 11
    BB_12 = 12
    BB_13 = 13
    BB_14 = 14
    BB_15 = 15
    BB_16 = 16
    BB_17 = 17
    BB_18 = 18
    BB_19 = 19
    BB_20 = 20
    BB_30 = 30
    BB_50 = 50
    BB_100 = 100

    @property
    def value(self) -> int:
        """Numeric value in BB."""
        return self._value_  # type: ignore

    @property
    def label(self) -> str:
        """Human-readable label."""
        return f"{self.value} BB"

    @classmethod
    def from_int(cls, stack_value: int) -> 'EffectiveStack':
        """Factory method from integer value."""
        for stack in cls:
            if stack.value == stack_value:
                return stack
        # Default to 100 BB if not found
        return cls.BB_100

    @classmethod
    def from_string(cls, stack_str: str) -> 'EffectiveStack':
        """Factory method from string."""
        try:
            # Try to parse as integer first
            stack_value = int(stack_str)
            return cls.from_int(stack_value)
        except ValueError:
            try:
                return cls[stack_str.upper()]
            except KeyError:
                return cls.BB_100

    @classmethod
    def all_values(cls) -> list[int]:
        """Return all available stack values as integers."""
        return [stack.value for stack in cls]

    @classmethod
    def all_labels(cls) -> list[str]:
        """Return all available stack labels."""
        return [stack.label for stack in cls]
