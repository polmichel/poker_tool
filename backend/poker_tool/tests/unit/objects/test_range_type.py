"""
Unit tests for RangeType value object.
"""
import unittest
from poker_tool.objects.range_type import RangeType


class TestRangeType(unittest.TestCase):
    """Tests for RangeType enum."""

    def test_range_type_values(self):
        """Test RangeType enum values."""
        self.assertEqual(RangeType.PREFLOP.name, "PREFLOP")
        self.assertEqual(RangeType.POSTFLOP.name, "POSTFLOP")
        self.assertEqual(RangeType.PUSH_FOLD.name, "PUSH_FOLD")

    def test_range_type_label(self):
        """Test label property."""
        labels = {
            RangeType.PREFLOP: "Preflop",
            RangeType.POSTFLOP: "Postflop",
            RangeType.PUSH_FOLD: "Push/Fold",
        }
        
        for range_type, expected_label in labels.items():
            self.assertEqual(range_type.label, expected_label)

    def test_range_type_description(self):
        """Test description property."""
        descriptions = {
            RangeType.PREFLOP: "Range utilisée avant le flop",
            RangeType.POSTFLOP: "Range utilisée après le flop",
            RangeType.PUSH_FOLD: "Range pour les situations push/fold (tournois)",
        }
        
        for range_type, expected_description in descriptions.items():
            self.assertEqual(range_type.description, expected_description)

    def test_range_type_from_string(self):
        """Test factory method from string."""
        # Valid range type strings
        range_type = RangeType.from_string("PREFLOP")
        self.assertEqual(range_type, RangeType.PREFLOP)
        
        range_type = RangeType.from_string("preflop")
        self.assertEqual(range_type, RangeType.PREFLOP)
        
        range_type = RangeType.from_string("POSTFLOP")
        self.assertEqual(range_type, RangeType.POSTFLOP)
        
        # Invalid range type string (defaults to PREFLOP)
        range_type = RangeType.from_string("INVALID")
        self.assertEqual(range_type, RangeType.PREFLOP)


if __name__ == '__main__':
    unittest.main()
