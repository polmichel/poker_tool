"""
Immutable range entity (Elegant Objects).
"""
from typing import Dict, Optional, List
from .hand import Hand, RANKS
from .action import Action, ActionType
from .position import Position
from .range_type import RangeType


class Range:
    """Poker range entity."""

    def __init__(
        self,
        name: str,
        description: str = "",
        range_type: RangeType = RangeType.PREFLOP,
        position: Position = Position.UNDEFINED,
        hands: Optional[Dict[str, Action]] = None,
        user_id: Optional[int] = None,
        range_id: Optional[int] = None,
    ):
        self._name = name
        self._description = description
        self._type = range_type
        self._position = position
        self._hands = hands or {}
        self._user_id = user_id
        self._id = range_id

    @property
    def id(self) -> Optional[int]:
        """Range ID."""
        return self._id

    @property
    def name(self) -> str:
        """Range name."""
        return self._name

    @property
    def description(self) -> str:
        """Range description."""
        return self._description

    @property
    def type(self) -> RangeType:
        """Range type."""
        return self._type

    @property
    def position(self) -> Position:
        """Position."""
        return self._position

    @property
    def hands(self) -> Dict[str, Action]:
        """Hands with their actions."""
        return self._hands

    @property
    def user_id(self) -> Optional[int]:
        """User ID."""
        return self._user_id

    def with_hand(self, hand_str: str, action: Action) -> 'Range':
        """Return new Range with added/updated hand (immutable)."""
        new_hands = dict(self._hands)
        new_hands[hand_str] = action
        return Range(
            name=self._name,
            description=self._description,
            range_type=self._type,
            position=self._position,
            hands=new_hands,
            user_id=self._user_id,
            range_id=self._id,
        )

    def without_hand(self, hand_str: str) -> 'Range':
        """Return new Range with removed hand (immutable)."""
        new_hands = dict(self._hands)
        new_hands.pop(hand_str, None)
        return Range(
            name=self._name,
            description=self._description,
            range_type=self._type,
            position=self._position,
            hands=new_hands,
            user_id=self._user_id,
            range_id=self._id,
        )

    def grid(self) -> List[List[Dict]]:
        """Generate 13x13 grid representation."""
        grid = []
        for i, rank1 in enumerate(RANKS):
            row = []
            for j, rank2 in enumerate(RANKS):
                if i <= j:
                    hand_str = f"{rank1}{rank2}s" if i == j else f"{rank1}{rank2}s"
                else:
                    hand_str = f"{rank2}{rank1}o"
                action = self._hands.get(hand_str, Action(ActionType.UNDEFINED))
                row.append({
                    "hand": hand_str,
                    "action": str(action),
                    "color": action.color,
                })
            grid.append(row)
        return grid

    def statistics(self) -> Dict:
        """Calculate range statistics."""
        by_action = {}
        for action in self._hands.values():
            by_action[action.type.name] = by_action.get(action.type.name, 0) + 1
        return {
            "total_hands": len(self._hands),
            "by_action": by_action,
        }

    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            "id": self._id,
            "name": self._name,
            "description": self._description,
            "range_type": self._type.name.lower(),
            "position": self._position.name,
            "hands": {k: str(v) for k, v in self._hands.items()},
            "user_id": self._user_id,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'Range':
        """Create from dictionary."""
        hands = {
            hand_str: Action(ActionType[action.upper()])
            for hand_str, action in data.get("hands", {}).items()
        }
        return cls(
            name=data.get("name", ""),
            description=data.get("description", ""),
            range_type=RangeType[data.get("range_type", "preflop").upper()],
            position=Position[data.get("position", "undefined").upper()],
            hands=hands,
            user_id=data.get("user_id"),
            range_id=data.get("id"),
        )
