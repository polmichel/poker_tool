"""
Unit tests for Position value object.
"""
import unittest

from poker_tool.objects.position import Position


class TestPosition(unittest.TestCase):
    """Tests for Position enum."""

    def test_position_values(self):
        """Test Position enum values."""
        self.assertEqual(Position.UTG.name, "UTG")
        self.assertEqual(Position.UTG_PLUS_1.name, "UTG_PLUS_1")
        self.assertEqual(Position.LJ.name, "LJ")
        self.assertEqual(Position.HJ.name, "HJ")
        self.assertEqual(Position.CO.name, "CO")
        self.assertEqual(Position.BTN.name, "BTN")
        self.assertEqual(Position.SB.name, "SB")
        self.assertEqual(Position.BB.name, "BB")
        self.assertEqual(Position.UNDEFINED.name, "UNDEFINED")

    def test_position_label(self):
        """Test label property."""
        labels = {
            Position.UTG: "UTG",
            Position.UTG_PLUS_1: "UTG+1",
            Position.LJ: "LJ",
            Position.HJ: "HJ",
            Position.CO: "CO",
            Position.BTN: "BTN",
            Position.SB: "SB",
            Position.BB: "BB",
            Position.UNDEFINED: "Non défini",
        }

        for position, expected_label in labels.items():
            self.assertEqual(position.label, expected_label)

    def test_position_color(self):
        """Test color property."""
        colors = {
            Position.UTG: "#FF5722",
            Position.UTG_PLUS_1: "#FF7043",
            Position.LJ: "#FF9800",
            Position.HJ: "#FFC107",
            Position.CO: "#FFE0B2",
            Position.BTN: "#4CAF50",
            Position.SB: "#2196F3",
            Position.BB: "#9C27B0",
            Position.UNDEFINED: "#607D8B",
        }

        for position, expected_color in colors.items():
            self.assertEqual(position.color, expected_color)

    def test_position_from_string(self):
        """Test factory method from string."""
        # Valid position strings
        position = Position.from_string("UTG")
        self.assertEqual(position, Position.UTG)

        position = Position.from_string("utg")
        self.assertEqual(position, Position.UTG)

        position = Position.from_string("UTG+1")
        self.assertEqual(position, Position.UTG_PLUS_1)

        position = Position.from_string("utg_plus_1")
        self.assertEqual(position, Position.UTG_PLUS_1)

        position = Position.from_string("LJ")
        self.assertEqual(position, Position.LJ)

        position = Position.from_string("lj")
        self.assertEqual(position, Position.LJ)

        position = Position.from_string("HJ")
        self.assertEqual(position, Position.HJ)

        position = Position.from_string("BTN")
        self.assertEqual(position, Position.BTN)

        # Invalid position string
        position = Position.from_string("INVALID")
        self.assertEqual(position, Position.UNDEFINED)


if __name__ == '__main__':
    unittest.main()
