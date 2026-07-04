"""
Domain objects for Poker Scenarios (Elegant Objects principles).
"""
from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional, Dict
from .range import RangeType, Position


class ScenarioType(Enum):
    """Types of poker scenarios."""
    CASH_GAME = auto()
    TOURNAMENT = auto()
    PUSH_FOLD = auto()
    HEADS_UP = auto()


@dataclass(frozen=True)
class Scenario:
    """Immutable representation of a poker scenario."""
    id: Optional[int] = None
    name: str = ""
    description: str = ""
    scenario_type: ScenarioType = ScenarioType.CASH_GAME
    stack_size: Optional[float] = None
    position: Position = Position.UNDEFINED
    action: str = ""
    range_id: Optional[int] = None
    user_id: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "scenario_type": self.scenario_type.name.lower() if self.scenario_type else None,
            "stack_size": self.stack_size,
            "position": self.position.name if self.position else None,
            "action": self.action,
            "range_id": self.range_id,
            "user_id": self.user_id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Scenario':
        """Create a Scenario from dictionary."""
        return cls(
            id=data.get("id"),
            name=data.get("name", ""),
            description=data.get("description", ""),
            scenario_type=ScenarioType[data.get("scenario_type", "cash_game").upper()] 
                if data.get("scenario_type") else ScenarioType.CASH_GAME,
            stack_size=data.get("stack_size"),
            position=Position[data.get("position", "undefined").upper()] 
                if data.get("position") else Position.UNDEFINED,
            action=data.get("action", ""),
            range_id=data.get("range_id"),
            user_id=data.get("user_id"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )
