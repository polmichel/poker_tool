"""Unit tests for the Phevaluator adapter."""
import unittest

from poker_tool.adapters.phevaluator.evaluator import Phevaluator


class TestPhevaluator(unittest.TestCase):
    """Tests for the phevaluator HandEvaluator adapter."""

    def setUp(self):
        self.ev = Phevaluator()

    def test_implements_port(self):
        """Phevaluator must be a HandEvaluator (injectable)."""
        from poker_tool.interfaces.hand_evaluator import HandEvaluator
        self.assertIsInstance(self.ev, HandEvaluator)

    def test_returns_int(self):
        """evaluate returns an int rank (lower = better)."""
        r = self.ev.evaluate(["Ah", "Kh"], ["2d", "3c", "6s", "8d", "Tc"])
        self.assertIsInstance(r, int)

    def test_high_card_vs_royal_flush(self):
        """A royal flush ranks better (lower int) than a high-card hand."""
        royal = self.ev.evaluate(["Ah", "Kh"], ["Qh", "Jh", "Th", "2d", "3c"])
        high = self.ev.evaluate(["2d", "3c"], ["4s", "5d", "7c", "9h", "Td"])
        self.assertLess(royal, high)

    def test_pair_beats_high_card(self):
        """A pair ranks better (lower int) than ace high (board with no straight)."""
        pair = self.ev.evaluate(["Ah", "Ad"], ["2d", "3c", "6s", "8d", "Tc"])
        ace_high = self.ev.evaluate(["Ah", "Kh"], ["2d", "3c", "6s", "8d", "Tc"])
        self.assertLess(pair, ace_high)

    def test_quads_beat_full_house(self):
        """Quads rank better (lower int) than a full house."""
        quads = self.ev.evaluate(["Ah", "Ad"], ["Ac", "As", "Kh", "2d", "3c"])
        full_house = self.ev.evaluate(["Ah", "Ad"], ["Ac", "Kh", "2d", "3c", "4s"])
        self.assertLess(quads, full_house)

    def test_same_hand_same_rank(self):
        """Evaluating the same 7 cards twice returns the same rank."""
        r1 = self.ev.evaluate(["Ah", "Kh"], ["2d", "3c", "6s", "8d", "Tc"])
        r2 = self.ev.evaluate(["Ah", "Kh"], ["2d", "3c", "6s", "8d", "Tc"])
        self.assertEqual(r1, r2)


if __name__ == "__main__":
    unittest.main()
