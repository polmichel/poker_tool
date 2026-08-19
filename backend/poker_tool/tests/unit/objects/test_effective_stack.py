"""
Unit tests for EffectiveStack value object.
"""
import unittest

from poker_tool.objects.effective_stack import EFFECTIVE_STACK_VALUES, EffectiveStack


class TestEffectiveStack(unittest.TestCase):
    """Tests for EffectiveStack enum."""

    def test_effective_stack_values(self):
        """Test EffectiveStack enum values."""
        self.assertEqual(EffectiveStack.BB_5.value, 5)
        self.assertEqual(EffectiveStack.BB_10.value, 10)
        self.assertEqual(EffectiveStack.BB_20.value, 20)
        self.assertEqual(EffectiveStack.BB_30.value, 30)
        self.assertEqual(EffectiveStack.BB_50.value, 50)
        self.assertEqual(EffectiveStack.BB_100.value, 100)

    def test_effective_stack_label(self):
        """Test label property."""
        self.assertEqual(EffectiveStack.BB_5.label, "5 BB")
        self.assertEqual(EffectiveStack.BB_10.label, "10 BB")
        self.assertEqual(EffectiveStack.BB_20.label, "20 BB")
        self.assertEqual(EffectiveStack.BB_100.label, "100 BB")

    def test_effective_stack_from_int(self):
        """Test factory method from integer."""
        stack = EffectiveStack.from_int(5)
        self.assertEqual(stack, EffectiveStack.BB_5)

        stack = EffectiveStack.from_int(100)
        self.assertEqual(stack, EffectiveStack.BB_100)

        stack = EffectiveStack.from_int(25)
        self.assertEqual(stack, EffectiveStack.BB_100)  # Default to 100 if not found

    def test_effective_stack_from_string(self):
        """Test factory method from string."""
        stack = EffectiveStack.from_string("5")
        self.assertEqual(stack, EffectiveStack.BB_5)

        stack = EffectiveStack.from_string("100")
        self.assertEqual(stack, EffectiveStack.BB_100)

        stack = EffectiveStack.from_string("BB_100")
        self.assertEqual(stack, EffectiveStack.BB_100)

        stack = EffectiveStack.from_string("invalid")
        self.assertEqual(stack, EffectiveStack.BB_100)  # Default to 100 if not found

    def test_all_values(self):
        """Test all_values method."""
        values = EffectiveStack.all_values()
        expected = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 50, 100]
        self.assertEqual(sorted(values), sorted(expected))

    def test_all_labels(self):
        """Test all_labels method."""
        labels = EffectiveStack.all_labels()
        expected = [f"{v} BB" for v in [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 50, 100]]
        self.assertEqual(sorted(labels), sorted(expected))

    def test_effective_stack_values_constant(self):
        """Test EFFECTIVE_STACK_VALUES constant."""
        expected = [50, 100, 30, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5]
        self.assertEqual(EFFECTIVE_STACK_VALUES, expected)


if __name__ == '__main__':
    unittest.main()
