"""
Unit tests for RangeService using FakeDatabase (no mocks!).
Elegant Objects principle: Test with real implementations via ports.
"""
import pytest
from poker_tool.domain.range import Range, RangeType, Position, ActionType
from poker_tool.domain.hand import Hand
from poker_tool.ports.database import DatabasePort
from poker_tool.services.range_service import RangeService


class FakeDatabase(DatabasePort):
    """Fake implementation of DatabasePort for testing."""
    
    def __init__(self):
        self.ranges = {}
        self.ranges_by_id = {}
        self.next_id = 1
    
    def init_app(self, app):
        pass
    
    def create_all(self):
        pass
    
    def drop_all(self):
        pass
    
    # User operations (not used in these tests)
    def save_user(self, user):
        pass
    def get_user_by_id(self, user_id):
        pass
    def get_user_by_username(self, username):
        pass
    def get_user_by_email(self, email):
        pass
    def get_all_users(self):
        return []
    
    # Range operations
    def save_range(self, range_obj: Range) -> Range:
        range_id = self.next_id
        self.next_id += 1
        range_obj = Range(
            id=range_id,
            name=range_obj.name,
            description=range_obj.description,
            range_type=range_obj.range_type,
            position=range_obj.position,
            hands=range_obj.hands,
            user_id=range_obj.user_id,
        )
        self.ranges[range_id] = range_obj
        self.ranges_by_id[range_id] = range_obj
        return range_obj
    
    def get_range_by_id(self, range_id: int) -> Range:
        return self.ranges_by_id.get(range_id)
    
    def get_all_ranges(self) -> list:
        return list(self.ranges.values())
    
    def get_ranges_by_user(self, user_id: int) -> list:
        return [r for r in self.ranges.values() if r.user_id == user_id]
    
    def update_range(self, range_id: int, data: dict) -> Range:
        if range_id not in self.ranges:
            return None
        range_obj = self.ranges[range_id]
        updated_data = {**range_obj.to_dict(), **data}
        updated_range = Range.from_dict(updated_data)
        self.ranges[range_id] = updated_range
        self.ranges_by_id[range_id] = updated_range
        return updated_range
    
    def delete_range(self, range_id: int) -> bool:
        if range_id in self.ranges:
            del self.ranges[range_id]
            del self.ranges_by_id[range_id]
            return True
        return False
    
    # Scenario operations (not used in these tests)
    def save_scenario(self, scenario):
        pass
    def get_scenario_by_id(self, scenario_id):
        pass
    def get_all_scenarios(self):
        return []
    def get_scenarios_by_user(self, user_id):
        return []
    def delete_scenario(self, scenario_id):
        pass


# Fixture for RangeService with FakeDatabase
@pytest.fixture
def range_service():
    fake_db = FakeDatabase()
    return RangeService(fake_db)


class TestRangeService:
    """Tests for RangeService using real implementation with FakeDatabase."""
    
    def test_create_range(self, range_service):
        """Test creating a new range."""
        range_obj = range_service.create_range(
            name="UTG Open",
            description="Standard UTG opening range",
            range_type=RangeType.PREFLOP,
            position=Position.UTG,
            hands={"AA": ActionType.OPEN, "KK": ActionType.OPEN},
            user_id=1,
        )
        
        assert range_obj.id == 1
        assert range_obj.name == "UTG Open"
        assert range_obj.range_type == RangeType.PREFLOP
        assert range_obj.position == Position.UTG
        assert "AA" in range_obj.hands
        assert range_obj.hands["AA"] == ActionType.OPEN
    
    def test_get_range_by_id(self, range_service):
        """Test getting a range by ID."""
        # Create a range first
        created = range_service.create_range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
        )
        
        # Get it back
        retrieved = range_service.get_range_by_id(created.id)
        
        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.name == "Test Range"
    
    def test_get_range_by_id_not_found(self, range_service):
        """Test getting a non-existent range."""
        result = range_service.get_range_by_id(999)
        assert result is None
    
    def test_get_all_ranges(self, range_service):
        """Test getting all ranges."""
        # Create some ranges
        range_service.create_range(name="Range 1", range_type=RangeType.PREFLOP)
        range_service.create_range(name="Range 2", range_type=RangeType.POSTFLOP)
        
        all_ranges = range_service.get_all_ranges()
        
        assert len(all_ranges) == 2
        assert all_ranges[0].name == "Range 1"
        assert all_ranges[1].name == "Range 2"
    
    def test_update_range(self, range_service):
        """Test updating a range."""
        # Create a range
        created = range_service.create_range(name="Original", description="Original desc")
        
        # Update it
        updated = range_service.update_range(created.id, {"name": "Updated", "description": "New desc"})
        
        assert updated is not None
        assert updated.name == "Updated"
        assert updated.description == "New desc"
    
    def test_delete_range(self, range_service):
        """Test deleting a range."""
        # Create a range
        created = range_service.create_range(name="To Delete")
        
        # Delete it
        success = range_service.delete_range(created.id)
        
        assert success is True
        assert range_service.get_range_by_id(created.id) is None
    
    def test_delete_range_not_found(self, range_service):
        """Test deleting a non-existent range."""
        success = range_service.delete_range(999)
        assert success is False
    
    def test_get_range_grid(self, range_service):
        """Test getting a range grid."""
        range_obj = range_service.create_range(
            name="Test Range",
            hands={"AA": ActionType.OPEN, "KK": ActionType.RAISE},
        )
        
        grid = range_service.get_range_grid(range_obj.id)
        
        assert grid is not None
        assert len(grid) == 13  # 13 rows
        assert len(grid[0]) == 13  # 13 columns
    
    def test_get_range_statistics(self, range_service):
        """Test getting range statistics."""
        range_obj = range_service.create_range(
            name="Test Range",
            hands={
                "AA": ActionType.OPEN,
                "KK": ActionType.OPEN,
                "QQ": ActionType.RAISE,
            },
        )
        
        stats = range_service.get_range_statistics(range_obj.id)
        
        assert stats is not None
        assert stats["total_hands"] == 3
        assert "OPEN" in stats["by_action"]
        assert stats["by_action"]["OPEN"] == 2
    
    def test_update_hand_action(self, range_service):
        """Test updating a hand action in a range."""
        range_obj = range_service.create_range(
            name="Test Range",
            hands={"AA": ActionType.OPEN},
        )
        
        updated = range_service.update_hand_action(
            range_id=range_obj.id,
            hand_str="AA",
            action=ActionType.RAISE,
        )
        
        assert updated is not None
        assert updated.hands["AA"] == ActionType.RAISE
    
    def test_get_default_ranges(self, range_service):
        """Test getting default ranges."""
        defaults = range_service.get_default_ranges()
        
        assert isinstance(defaults, list)
        assert len(defaults) > 0
        assert defaults[0]["name"] == "UTG Open Range (100bb)"
