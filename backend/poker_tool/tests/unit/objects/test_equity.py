"""Unit tests for the equity result value objects."""
import unittest

from poker_tool.objects.equity import EquityByHand, EquityResult, hand_combos


class TestHandCombos(unittest.TestCase):
    """Tests for hand_combos()."""

    def test_pair_combos(self):
        """Test that a pair has 6 combos."""
        self.assertEqual(hand_combos("A", "A", False), 6)

    def test_suited_combos(self):
        """Test that a suited hand has 4 combos."""
        self.assertEqual(hand_combos("A", "K", True), 4)

    def test_offsuit_combos(self):
        """Test that an offsuit hand has 12 combos."""
        self.assertEqual(hand_combos("A", "K", False), 12)


class TestEquityByHand(unittest.TestCase):
    """Tests for EquityByHand."""

    def test_to_dict(self):
        """Test serialization to dictionary."""
        eq = EquityByHand("AKs", 4, 46.5, 1.0, 52.5)
        d = eq.to_dict()
        self.assertEqual(d["hand"], "AKs")
        self.assertEqual(d["combos"], 4)
        self.assertEqual(d["win"], 46.5)
        self.assertEqual(d["tie"], 1.0)
        self.assertEqual(d["lose"], 52.5)

    def test_properties(self):
        """Test property accessors."""
        eq = EquityByHand("QQ", 6, 18.0, 0.5, 81.5)
        self.assertEqual(eq.hand, "QQ")
        self.assertEqual(eq.combos, 6)
        self.assertEqual(eq.win, 18.0)
        self.assertEqual(eq.tie, 0.5)
        self.assertEqual(eq.lose, 81.5)


class TestEquityResult(unittest.TestCase):
    """Tests for EquityResult."""

    def test_to_dict(self):
        """Test serialization to dictionary."""
        by_hand = [EquityByHand("QQ", 6, 18.0, 0.5, 81.5)]
        result = EquityResult("AKs", 46.5, 1.0, 52.5, 10000, by_hand)
        d = result.to_dict()
        self.assertEqual(d["hero"], "AKs")
        self.assertEqual(d["win"], 46.5)
        self.assertEqual(d["tie"], 1.0)
        self.assertEqual(d["lose"], 52.5)
        self.assertEqual(d["iterations"], 10000)
        self.assertEqual(len(d["by_hand"]), 1)
        self.assertEqual(d["by_hand"][0]["hand"], "QQ")

    def test_by_hand_is_copied(self):
        """Test that by_hand returns a copy (immutability)."""
        by_hand = [EquityByHand("QQ", 6, 18.0, 0.5, 81.5)]
        result = EquityResult("AKs", 46.5, 1.0, 52.5, 10000, by_hand)
        returned = result.by_hand
        returned.append(EquityByHand("KK", 6, 0.0, 0.0, 0.0))
        self.assertEqual(len(result.by_hand), 1)


if __name__ == "__main__":
    unittest.main()
