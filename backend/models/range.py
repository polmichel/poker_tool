from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from .hand import Hand, ActionType, RANKS, generate_all_hands
import json


class RangeType(Enum):
    PREFLOP = "preflop"
    POSTFLOP = "postflop"
    PUSH_FOLD = "push_fold"


class Position(Enum):
    UTG = "UTG"
    MP = "MP"
    CO = "CO"
    BTN = "BTN"
    SB = "SB"
    BB = "BB"
    UNDEFINED = "undefined"


@dataclass
class Range:
    """Représente une range de poker (ensemble de mains avec des actions associées)."""
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    range_type: RangeType = RangeType.PREFLOP
    position: Position = Position.UNDEFINED
    hands: Dict[str, ActionType] = field(default_factory=dict)  # {"AKs": ActionType.OPEN, ...}
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def __post_init__(self):
        if not self.hands:
            self.hands = {}
    
    def add_hand(self, hand: Hand, action: ActionType) -> None:
        """Ajoute une main à la range avec une action."""
        hand_str = hand.to_string()
        self.hands[hand_str] = action
        self.updated_at = datetime.now().isoformat()
    
    def remove_hand(self, hand: Hand) -> None:
        """Retire une main de la range."""
        hand_str = hand.to_string()
        if hand_str in self.hands:
            del self.hands[hand_str]
        self.updated_at = datetime.now().isoformat()
    
    def get_action(self, hand: Hand) -> ActionType:
        """Récupère l'action associée à une main."""
        hand_str = hand.to_string()
        return self.hands.get(hand_str, ActionType.UNDEFINED)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit la range en dictionnaire pour la sérialisation."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "range_type": self.range_type.value,
            "position": self.position.value,
            "hands": {hand_str: action.value for hand_str, action in self.hands.items()},
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Range":
        """Crée une Range à partir d'un dictionnaire."""
        hands = {}
        if "hands" in data:
            for hand_str, action_str in data["hands"].items():
                try:
                    action = ActionType(action_str)
                    hands[hand_str] = action
                except ValueError:
                    hands[hand_str] = ActionType.UNDEFINED
        
        return cls(
            id=data.get("id"),
            name=data.get("name", ""),
            description=data.get("description", ""),
            range_type=RangeType(data.get("range_type", "preflop")),
            position=Position(data.get("position", "undefined")),
            hands=hands,
            created_at=data.get("created_at", datetime.now().isoformat()),
            updated_at=data.get("updated_at", datetime.now().isoformat()),
        )
    
    def to_json(self) -> str:
        """Sérialise la range en JSON."""
        return json.dumps(self.to_dict(), indent=2)
    
    @classmethod
    def from_json(cls, json_str: str) -> "Range":
        """Désérialise une range depuis un JSON."""
        data = json.loads(json_str)
        return cls.from_dict(data)
    
    def get_grid(self) -> List[List[Dict[str, Any]]]:
        """Retourne une grille 13x13 avec les actions pour chaque main."""
        grid = []
        for rank1 in RANKS:
            row = []
            for rank2 in RANKS:
                if RANKS.index(rank1) < RANKS.index(rank2):
                    hand_str = f"{rank1}{rank2}s"
                elif RANKS.index(rank1) > RANKS.index(rank2):
                    hand_str = f"{rank2}{rank1}o"
                else:
                    hand_str = f"{rank1}{rank2}"
                
                action = self.hands.get(hand_str, ActionType.UNDEFINED)
                row.append({
                    "hand": hand_str,
                    "action": action.value,
                    "color": action.value in [a.value for a in ActionType] and ACTION_COLORS.get(action, "#FFFFFF"),
                })
            grid.append(row)
        return grid
    
    def get_statistics(self) -> Dict[str, Any]:
        """Calcule des statistiques sur la range."""
        total_hands = len(self.hands)
        action_counts = {}
        for action in ActionType:
            count = sum(1 for a in self.hands.values() if a == action)
            action_counts[action.value] = count
        
        return {
            "total_hands": total_hands,
            "action_counts": action_counts,
            "percentage": total_hands / 169 * 100 if total_hands > 0 else 0,
        }


@dataclass
class RangeSchema:
    """Schema pour la sérialisation/désérialisation des ranges."""
    @staticmethod
    def serialize(range_obj: Range) -> Dict[str, Any]:
        return range_obj.to_dict()
    
    @staticmethod
    def deserialize(data: Dict[str, Any]) -> Range:
        return Range.from_dict(data)


if __name__ == "__main__":
    # Test
    range_obj = Range(
        name="UTG Open Range",
        description="Range d'ouverture depuis UTG",
        range_type=RangeType.PREFLOP,
        position=Position.UTG,
    )
    
    # Ajouter des mains
    range_obj.add_hand(Hand("A", "K", suited=True), ActionType.OPEN)
    range_obj.add_hand(Hand("A", "A"), ActionType.OPEN)
    range_obj.add_hand(Hand("K", "Q", suited=True), ActionType.OPEN)
    
    print("Range :")
    print(range_obj.to_json())
    
    print("\nGrille :")
    grid = range_obj.get_grid()
    for row in grid:
        print([cell["hand"] + ":" + cell["action"] for cell in row])
    
    print("\nStatistiques :")
    print(range_obj.get_statistics())
