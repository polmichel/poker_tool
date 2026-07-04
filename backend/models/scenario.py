from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
from .hand import Hand, ActionType
from .range import Range, RangeType, Position


class ScenarioType(Enum):
    CASH_GAME = "cash_game"
    TOURNAMENT = "tournament"
    PUSH_FOLD = "push_fold"
    HEADS_UP = "heads_up"


@dataclass
class Scenario:
    """Représente un scénario de poker (contexte pour une range)."""
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    scenario_type: ScenarioType = ScenarioType.CASH_GAME
    stack_size: Optional[float] = None  # En big blinds
    position: Position = Position.UNDEFINED
    action: str = ""  # Ex: "Open", "Call vs Raise", "3-Bet"
    range_id: Optional[int] = None  # ID de la range associée
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit le scénario en dictionnaire."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "scenario_type": self.scenario_type.value,
            "stack_size": self.stack_size,
            "position": self.position.value,
            "action": self.action,
            "range_id": self.range_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Scenario":
        """Crée un Scenario à partir d'un dictionnaire."""
        return cls(
            id=data.get("id"),
            name=data.get("name", ""),
            description=data.get("description", ""),
            scenario_type=ScenarioType(data.get("scenario_type", "cash_game")),
            stack_size=data.get("stack_size"),
            position=Position(data.get("position", "undefined")),
            action=data.get("action", ""),
            range_id=data.get("range_id"),
            created_at=data.get("created_at", datetime.now().isoformat()),
            updated_at=data.get("updated_at", datetime.now().isoformat()),
        )


@dataclass
class ScenarioSchema:
    """Schema pour la sérialisation/désérialisation des scénarios."""
    @staticmethod
    def serialize(scenario: Scenario) -> Dict[str, Any]:
        return scenario.to_dict()
    
    @staticmethod
    def deserialize(data: Dict[str, Any]) -> Scenario:
        return Scenario.from_dict(data)


# Exemples de scénarios prédéfinis
def get_default_scenarios() -> List[Dict[str, Any]]:
    """Retourne une liste de scénarios par défaut."""
    return [
        {
            "name": "UTG Open (100bb)",
            "description": "Ouverture depuis UTG en cash game 100bb",
            "scenario_type": "cash_game",
            "stack_size": 100,
            "position": "UTG",
            "action": "Open",
        },
        {
            "name": "BTN Open (100bb)",
            "description": "Ouverture depuis BTN en cash game 100bb",
            "scenario_type": "cash_game",
            "stack_size": 100,
            "position": "BTN",
            "action": "Open",
        },
        {
            "name": "SB vs BB Push/Fold (15bb)",
            "description": "Push/Fold depuis SB avec 15bb en tournoi",
            "scenario_type": "tournament",
            "stack_size": 15,
            "position": "SB",
            "action": "Push",
        },
        {
            "name": "BB Call vs SB Push (15bb)",
            "description": "Call depuis BB contre un push de SB avec 15bb",
            "scenario_type": "tournament",
            "stack_size": 15,
            "position": "BB",
            "action": "Call vs Push",
        },
    ]


if __name__ == "__main__":
    # Test
    scenario = Scenario(
        name="UTG Open (100bb)",
        description="Ouverture depuis UTG en cash game 100bb",
        scenario_type=ScenarioType.CASH_GAME,
        stack_size=100,
        position=Position.UTG,
        action="Open",
    )
    
    print("Scénario :")
    print(scenario.to_dict())
