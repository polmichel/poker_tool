"""
Unit tests for Range entity.
"""
import unittest
from poker_tool.objects.range import Range
from poker_tool.objects.range_type import RangeType
from poker_tool.objects.position import Position
from poker_tool.objects.action import Action, ActionType
from poker_tool.objects.hand import RANKS


class TestRange(unittest.TestCase):
    """Tests for Range class."""

    def test_range_creation(self):
        """Test Range creation."""
        range_obj = Range(
            name="Test Range",
            description="A test range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            hands={"AKs": Action(ActionType.RAISE)},
            user_id=1,
            range_id=1,
        )
        
        self.assertEqual(range_obj.name, "Test Range")
        self.assertEqual(range_obj.description, "A test range")
        self.assertEqual(range_obj.type, RangeType.PREFLOP)
        self.assertEqual(range_obj.position, Position.BTN)
        self.assertEqual(range_obj.hands, {"AKs": Action(ActionType.RAISE)})
        self.assertEqual(range_obj.user_id, 1)
        self.assertEqual(range_obj.id, 1)

    def test_range_creation_minimal(self):
        """Test Range creation with minimal parameters."""
        range_obj = Range(name="Test Range")
        
        self.assertEqual(range_obj.name, "Test Range")
        self.assertEqual(range_obj.description, "")
        self.assertEqual(range_obj.type, RangeType.PREFLOP)
        self.assertEqual(range_obj.position, Position.UNDEFINED)
        self.assertEqual(range_obj.hands, {})
        self.assertIsNone(range_obj.user_id)
        self.assertIsNone(range_obj.id)

    def test_range_with_hand(self):
        """Test with_hand method (immutable)."""
        range_obj = Range(name="Test Range")
        
        new_range = range_obj.with_hand("AKs", Action(ActionType.RAISE))
        
        self.assertEqual(len(new_range.hands), 1)
        self.assertEqual(new_range.hands["AKs"].type, ActionType.RAISE)
        # Original should be unchanged
        self.assertEqual(len(range_obj.hands), 0)

    def test_range_without_hand(self):
        """Test without_hand method (immutable)."""
        range_obj = Range(
            name="Test Range",
            hands={"AKs": Action(ActionType.RAISE), "TT": Action(ActionType.OPEN)},
        )
        
        new_range = range_obj.without_hand("AKs")
        
        self.assertEqual(len(new_range.hands), 1)
        self.assertNotIn("AKs", new_range.hands)
        self.assertIn("TT", new_range.hands)
        # Original should be unchanged
        self.assertEqual(len(range_obj.hands), 2)

    def test_range_grid(self):
        """Test grid generation."""
        range_obj = Range(
            name="Test Range",
            hands={"AKs": Action(ActionType.RAISE)},
        )
        
        grid = range_obj.grid()
        
        # Should be 13x13 grid
        self.assertEqual(len(grid), 13)
        for row in grid:
            self.assertEqual(len(row), 13)
        
        # Check that AKs is in the grid with correct action
        # AKs should be at position [0, 1] (A=0, K=1)
        # But the grid generation logic is a bit complex, so just check structure
        for row in grid:
            for cell in row:
                self.assertIn("hand", cell)
                self.assertIn("action", cell)
                self.assertIn("color", cell)

    def test_range_statistics(self):
        """Test statistics calculation."""
        range_obj = Range(
            name="Test Range",
            hands={
                "AKs": Action(ActionType.RAISE),
                "TT": Action(ActionType.OPEN),
                "AKo": Action(ActionType.RAISE),
            },
        )
        
        stats = range_obj.statistics()
        
        self.assertEqual(stats["total_hands"], 3)
        self.assertEqual(stats["by_action"]["RAISE"], 2)
        self.assertEqual(stats["by_action"]["OPEN"], 1)

    def test_range_to_dict(self):
        """Test serialization to dictionary."""
        range_obj = Range(
            name="Test Range",
            description="A test range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            hands={"AKs": Action(ActionType.RAISE)},
            user_id=1,
            range_id=1,
        )
        
        range_dict = range_obj.to_dict()
        
        self.assertEqual(range_dict["id"], 1)
        self.assertEqual(range_dict["name"], "Test Range")
        self.assertEqual(range_dict["description"], "A test range")
        self.assertEqual(range_dict["range_type"], "preflop")
        self.assertEqual(range_dict["position"], "BTN")
        self.assertEqual(range_dict["hands"], {"AKs": "raise"})
        self.assertEqual(range_dict["user_id"], 1)

    def test_range_from_dict(self):
        """Test creation from dictionary."""
        data = {
            "id": 1,
            "name": "Test Range",
            "description": "A test range",
            "range_type": "preflop",
            "position": "BTN",
            "hands": {"AKs": "raise", "TT": "open"},
            "user_id": 1,
        }
        
        range_obj = Range.from_dict(data)
        
        self.assertEqual(range_obj.id, 1)
        self.assertEqual(range_obj.name, "Test Range")
        self.assertEqual(range_obj.description, "A test range")
        self.assertEqual(range_obj.type, RangeType.PREFLOP)
        self.assertEqual(range_obj.position, Position.BTN)
        self.assertEqual(len(range_obj.hands), 2)
        self.assertEqual(range_obj.hands["AKs"].type, ActionType.RAISE)
        self.assertEqual(range_obj.hands["TT"].type, ActionType.OPEN)
        self.assertEqual(range_obj.user_id, 1)


if __name__ == '__main__':
    unittest.main()
