"""
Unit tests for Action value object.
"""
import unittest
from poker_tool.objects.action import Action, ActionType


class TestActionType(unittest.TestCase):
    """Tests for ActionType enum."""

    def test_action_type_values(self):
        """Test ActionType enum values."""
        self.assertEqual(ActionType.OPEN.name, "OPEN")
        self.assertEqual(ActionType.RAISE.name, "RAISE")
        self.assertEqual(ActionType.CALL.name, "CALL")
        self.assertEqual(ActionType.FOLD.name, "FOLD")
        self.assertEqual(ActionType.ALL_IN.name, "ALL_IN")
        self.assertEqual(ActionType.UNDEFINED.name, "UNDEFINED")


class TestAction(unittest.TestCase):
    """Tests for Action class."""

    def test_action_creation(self):
        """Test Action creation."""
        action = Action(ActionType.OPEN)
        self.assertEqual(action.type, ActionType.OPEN)

    def test_action_color(self):
        """Test color property."""
        colors = {
            ActionType.OPEN: "#4CAF50",
            ActionType.RAISE: "#2196F3",
            ActionType.CALL: "#FF9800",
            ActionType.FOLD: "#F44336",
            ActionType.ALL_IN: "#9C27B0",
            ActionType.UNDEFINED: "#607D8B",
        }
        
        for action_type, expected_color in colors.items():
            action = Action(action_type)
            self.assertEqual(action.color, expected_color)

    def test_action_label(self):
        """Test label property."""
        labels = {
            ActionType.OPEN: "Ouvrir",
            ActionType.RAISE: "Relancer",
            ActionType.CALL: "Suivre",
            ActionType.FOLD: "Passer",
            ActionType.ALL_IN: "All-In",
            ActionType.UNDEFINED: "Non défini",
        }
        
        for action_type, expected_label in labels.items():
            action = Action(action_type)
            self.assertEqual(action.label, expected_label)

    def test_action_string_representation(self):
        """Test string representation."""
        action = Action(ActionType.OPEN)
        self.assertEqual(str(action), "open")
        
        action = Action(ActionType.RAISE)
        self.assertEqual(str(action), "raise")

    def test_action_equality(self):
        """Test equality comparison."""
        action1 = Action(ActionType.OPEN)
        action2 = Action(ActionType.OPEN)
        action3 = Action(ActionType.RAISE)
        
        self.assertEqual(action1, action2)
        self.assertNotEqual(action1, action3)
        self.assertNotEqual(action1, "not an action")

    def test_action_hash(self):
        """Test hash for use in sets/dicts."""
        action1 = Action(ActionType.OPEN)
        action2 = Action(ActionType.OPEN)
        
        # Should be able to use in sets
        action_set = {action1, action2}
        self.assertEqual(len(action_set), 1)
        
        # Should be able to use as dict keys
        action_dict = {action1: "value"}
        self.assertEqual(action_dict[action2], "value")

    def test_action_from_string(self):
        """Test factory method from string."""
        # Valid action strings
        action = Action.from_string("OPEN")
        self.assertEqual(action.type, ActionType.OPEN)
        
        action = Action.from_string("open")
        self.assertEqual(action.type, ActionType.OPEN)
        
        action = Action.from_string("Raise")
        self.assertEqual(action.type, ActionType.RAISE)
        
        # Invalid action string
        action = Action.from_string("INVALID")
        self.assertEqual(action.type, ActionType.UNDEFINED)


if __name__ == '__main__':
    unittest.main()
