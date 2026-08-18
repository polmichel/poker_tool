"""Unit tests for available_combos (hero-card-aware combo counting)."""
import unittest

from poker_tool.objects.equity import available_combos, hand_combos


class TestAvailableCombos(unittest.TestCase):
    """Tests for available_combos vs the raw hand_combos."""

    def test_pair_vs_disjoint_pair(self):
        """AA hero vs KK: no shared cards -> all 6 combos available."""
        hero = {"As", "Ah"}
        self.assertEqual(available_combos("K", "K", False, hero), 6)
        self.assertEqual(hand_combos("K", "K", False), 6)

    def test_pair_vs_shared_rank_pair(self):
        """AA hero vs AKs: hero holds 2 aces -> only 2 suited combos left."""
        hero = {"As", "Ah"}
        self.assertEqual(available_combos("A", "K", True, hero), 2)
        self.assertEqual(hand_combos("A", "K", True), 4)

    def test_pair_vs_shared_rank_offsuit(self):
        """AA hero vs AKo: 12 raw -> 6 (exclude combos using a hero ace)."""
        hero = {"As", "Ah"}
        self.assertEqual(available_combos("A", "K", False, hero), 6)
        self.assertEqual(hand_combos("A", "K", False), 12)

    def test_suited_hero_vs_suited_shared(self):
        """AhKh hero vs AKs: 4 raw -> 3 (the Ah-suited combo is gone)."""
        hero = {"Ah", "Kh"}
        self.assertEqual(available_combos("A", "K", True, hero), 3)

    def test_offsuit_hero_vs_offsuit_shared(self):
        """AhKh hero vs AKo: 12 raw -> 6 (exclude combos sharing Ah or Kh)."""
        hero = {"Ah", "Kh"}
        self.assertEqual(available_combos("A", "K", False, hero), 6)

    def test_disjoint_hands_unchanged(self):
        """AhKd hero vs QQ: no shared cards -> raw counts (6)."""
        hero = {"Ah", "Kd"}
        self.assertEqual(available_combos("Q", "Q", False, hero), 6)
        self.assertEqual(available_combos("J", "T", True, hero), 4)
        self.assertEqual(available_combos("J", "T", False, hero), 12)


if __name__ == "__main__":
    unittest.main()
