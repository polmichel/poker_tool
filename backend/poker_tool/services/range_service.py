"""
Range Service (Elegant Objects principles).
Orchestrates range-related use cases using injected dependencies.
"""
from typing import List, Optional, Dict
from ..domain.range import Range, RangeType, Position, ActionType
from ..domain.hand import Hand, generate_all_hands
from ..ports.database import DatabasePort


class RangeService:
    """Service for managing poker ranges."""
    
    def __init__(self, database: DatabasePort):
        """Inject database dependency."""
        self.database = database
    
    def create_range(
        self,
        name: str,
        description: str = "",
        range_type: RangeType = RangeType.PREFLOP,
        position: Position = Position.UNDEFINED,
        hands: Dict[str, ActionType] = None,
        user_id: int = None,
    ) -> Range:
        """Create a new poker range."""
        range_obj = Range(
            name=name,
            description=description,
            range_type=range_type,
            position=position,
            hands=hands or {},
            user_id=user_id,
        )
        return self.database.save_range(range_obj)
    
    def get_range_by_id(self, range_id: int) -> Optional[Range]:
        """Get a range by its ID."""
        return self.database.get_range_by_id(range_id)
    
    def get_all_ranges(self) -> List[Range]:
        """Get all poker ranges."""
        return self.database.get_all_ranges()
    
    def get_ranges_by_user(self, user_id: int) -> List[Range]:
        """Get all ranges for a specific user."""
        return self.database.get_ranges_by_user(user_id)
    
    def update_range(self, range_id: int, data: Dict) -> Optional[Range]:
        """Update a poker range."""
        return self.database.update_range(range_id, data)
    
    def delete_range(self, range_id: int) -> bool:
        """Delete a poker range."""
        return self.database.delete_range(range_id)
    
    def get_range_grid(self, range_id: int) -> Optional[List[List[Dict]]]:
        """Get the 13x13 grid for a range."""
        range_obj = self.get_range_by_id(range_id)
        if not range_obj:
            return None
        return range_obj.get_grid()
    
    def get_range_statistics(self, range_id: int) -> Optional[Dict]:
        """Get statistics for a range."""
        range_obj = self.get_range_by_id(range_id)
        if not range_obj:
            return None
        return range_obj.get_statistics()
    
    def update_hand_action(
        self,
        range_id: int,
        hand_str: str,
        action: ActionType,
    ) -> Optional[Range]:
        """Update the action for a specific hand in a range."""
        range_obj = self.get_range_by_id(range_id)
        if not range_obj:
            return None
        
        # Update the hand action
        updated_hands = dict(range_obj.hands)
        updated_hands[hand_str] = action
        
        return self.update_range(range_id, {"hands": updated_hands})
    
    def get_default_ranges(self) -> List[Dict]:
        """Get default poker ranges."""
        return [
            {
                "name": "UTG Open Range (100bb)",
                "description": "Range d'ouverture standard depuis UTG en cash game 100bb",
                "range_type": "preflop",
                "position": "UTG",
                "hands": {
                    "AA": "open",
                    "KK": "open",
                    "QQ": "open",
                    "JJ": "open",
                    "TT": "open",
                    "99": "open",
                    "88": "open",
                    "AKs": "open",
                    "AQs": "open",
                    "AJs": "open",
                    "ATs": "open",
                    "KQs": "open",
                    "AKo": "open",
                    "AQo": "open",
                },
            },
            {
                "name": "BTN Open Range (100bb)",
                "description": "Range d'ouverture large depuis BTN en cash game 100bb",
                "range_type": "preflop",
                "position": "BTN",
                "hands": {
                    "AA": "open",
                    "KK": "open",
                    "QQ": "open",
                    "JJ": "open",
                    "TT": "open",
                    "99": "open",
                    "88": "open",
                    "77": "open",
                    "66": "open",
                    "55": "open",
                    "AKs": "open",
                    "AQs": "open",
                    "AJs": "open",
                    "ATs": "open",
                    "A9s": "open",
                    "A8s": "open",
                    "A7s": "open",
                    "A6s": "open",
                    "A5s": "open",
                    "A4s": "open",
                    "A3s": "open",
                    "A2s": "open",
                    "KQs": "open",
                    "KJs": "open",
                    "KTs": "open",
                    "QJs": "open",
                    "JTs": "open",
                    "T9s": "open",
                    "98s": "open",
                    "AKo": "open",
                    "AQo": "open",
                    "AJo": "open",
                    "ATo": "open",
                    "A9o": "open",
                    "KQo": "open",
                    "KJo": "open",
                    "QJo": "open",
                },
            },
        ]
