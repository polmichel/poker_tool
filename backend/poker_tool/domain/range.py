"""
Domain objects for Poker Ranges (Elegant Objects principles).
All objects are immutable and have clear interfaces.
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import Dict, Optional, List


class RangeType(Enum):
    """Types of poker ranges."""
    PREFLOP = auto()
    POSTFLOP = auto()
    PUSH_FOLD = auto()


class Position(Enum):
    """Table positions in poker."""
    UTG = auto()
    MP = auto()
    CO = auto()
    BTN = auto()
    SB = auto()
    BB = auto()
    UNDEFINED = auto()


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
        """Convert hand to standard string representation (e.g., 'AKs', 'TT')."""
        if self.rank1 == self.rank2:
            return f"{self.rank1}{self.rank1}"
        return f"{self.rank1}{self.rank2}{"s" if self.suited else "o"}"
    
    @classmethod
    def from_string(cls, hand_str: str) -> 'Hand':
        """Create a Hand from string representation."""
        if len(hand_str) == 2:
            return cls(hand_str[0], hand_str[1], False)
        elif len(hand_str) == 3 and hand_str[2] == 's':
            return cls(hand_str[0], hand_str[1], True)
        elif len(hand_str) == 3 and hand_str[2] == 'o':
            return cls(hand_str[0], hand_str[1], False)
        else:
            raise ValueError(f"Invalid hand string: {hand_str}")


@dataclass(frozen=True)
class Range:
    """Immutable representation of a poker range."""
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    range_type: RangeType = RangeType.PREFLOP
    position: Position = Position.UNDEFINED
    hands: Dict[str, ActionType] = None
    user_id: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    def __post_init__(self):
        """Ensure immutability by converting mutable defaults to tuples."""
        object.__setattr__(self, 'hands', self.hands or {})
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "range_type": self.range_type.name.lower() if self.range_type else None,
            "position": self.position.name if self.position else None,
            "hands": {k: v.name.lower() for k, v in self.hands.items()},
            "user_id": self.user_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Range':
        """Create a Range from dictionary."""
        hands = {}
        if data.get("hands"):
            for hand_str, action in data["hands"].items():
                try:
                    hands[hand_str] = ActionType[action.upper()]
                except KeyError:
                    hands[hand_str] = ActionType.UNDEFINED
        
        return cls(
            id=data.get("id"),
            name=data.get("name", ""),
            description=data.get("description", ""),
            range_type=RangeType[data.get("range_type", "preflop").upper()] 
                if data.get("range_type") else RangeType.PREFLOP,
            position=Position[data.get("position", "undefined").upper()] 
                if data.get("position") else Position.UNDEFINED,
            hands=hands,
            user_id=data.get("user_id"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )
    
    def get_grid(self) -> List[List[Dict]]:
        """Generate a 13x13 grid representation."""
        from .hand import RANKS
        grid = []
        for i, rank1 in enumerate(RANKS):
            row = []
            for j, rank2 in enumerate(RANKS):
                if i <= j:
                    hand_str = f"{rank1}{rank2}s" if i == j else f"{rank1}{rank2}s"
                    action = self.hands.get(hand_str, ActionType.UNDEFINED)
                    row.append({
                        "hand": hand_str,
                        "action": action,
                        "color": self._get_color(action),
                    })
                else:
                    row.append({"hand": "", "action": ActionType.UNDEFINED, "color": ""})
            grid.append(row)
        return grid
    
    def _get_color(self, action: ActionType) -> str:
        """Get color for action type."""
        colors = {
            ActionType.OPEN: "#4CAF50",
            ActionType.RAISE: "#2196F3",
            ActionType.CALL: "#FF9800",
            ActionType.FOLD: "#F44336",
            ActionType.ALL_IN: "#9C27B0",
            ActionType.UNDEFINED: "#607D8B",
        }
        return colors.get(action, "#607D8B")
    
    def get_statistics(self) -> Dict:
        """Calculate statistics for this range."""
        total_hands = len(self.hands)
        by_action = {}
        for action in ActionType:
            count = sum(1 for a in self.hands.values() if a == action)
            if count > 0:
                by_action[action.name] = count
        
        return {
            "total_hands": total_hands,
            "by_action": by_action,
        }
