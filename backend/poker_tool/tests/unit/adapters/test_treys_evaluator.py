"""Unit tests for the TreysEvaluator adapter."""
import unittest

from poker_tool.adapters.treys.evaluator import TreysEvaluator
from poker_tool.interfaces.hand_evaluator import HandEvaluator


class TestTreysEvaluator(unittest.TestCase):
    """Tests for the treys-backed HandEvaluator adapter."""

    def test_implements_port(self):
        """Test that TreysEvaluator is a HandEvaluator."""
        self.assertIsInstance(TreysEvaluator(), HandEvaluator)

    def test_evaluate_returns_int(self):
        """Test that evaluate returns an integer rank."""
        evaluator = TreysEvaluator()
        rank = evaluator.evaluate(["Ah", "As"], ["2d", "3d", "7c", "9s", "Kd"])
        self.assertIsInstance(rank, int)

    def test_better_hand_has_lower_rank(self):
        """Test that a stronger hand evaluates to a lower rank (lower = better)."""
        evaluator = TreysEvaluator()
        # Royal flush (Ah Kh on a royal board) vs high card (2c 3c on same board).
        board = ["Qh", "Jh", "Th", "2c", "3c"]
        royal = evaluator.evaluate(["Ah", "Kh"], board)
        high_card = evaluator.evaluate(["2d", "3d"], board)
        self.assertLess(royal, high_card)

    def test_equal_hands_have_equal_rank(self):
        """Test that identical hands evaluate to the same rank."""
        evaluator = TreysEvaluator()
        board = ["2d", "3d", "7c", "9s", "Kd"]
        r1 = evaluator.evaluate(["Ah", "Ks"], board)
        r2 = evaluator.evaluate(["Ah", "Ks"], board)
        self.assertEqual(r1, r2)


if __name__ == "__main__":
    unittest.main()
