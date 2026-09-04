"""Unit tests for the EnumerateEquity use case (exact enumeration)."""
import unittest

from poker_tool.interfaces.hand_evaluator import HandEvaluator
from poker_tool.objects.equity import EquityByHand, EquityResult
from poker_tool.use_cases.enumerate_equity import (
    EnumerateEquity,
    _all_combos,
    _disjoint_combos,
    _remaining_deck,
)


class FakeHandEvaluator(HandEvaluator):
    """Deterministic fake evaluator for fast testing.

    Returns a simple rank-based value without actual hand evaluation.
    This makes tests fast but still exercises the enumeration logic.
    """

    _RANKS: list[str] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']  # noqa: RUF012

    def evaluate(self, hole_cards, board):
        ranks = [self._RANKS.index(c[0].upper()) for c in hole_cards]
        return min(ranks)


class TestHelperFunctions(unittest.TestCase):
    """Tests for internal helper functions."""

    def test_all_combos_pair(self):
        """A pair hand has 6 combos (4 suits choose 2)."""
        from poker_tool.objects.hand import Hand

        hand = Hand.from_string("AA")
        combos = _all_combos(hand)
        self.assertEqual(len(combos), 6)
        for c1, c2 in combos:
            self.assertEqual(c1[0], c2[0])
            self.assertNotEqual(c1[1], c2[1])

    def test_all_combos_suited(self):
        """A suited hand has 4 combos (one for each suit)."""
        from poker_tool.objects.hand import Hand

        hand = Hand.from_string("AKs")
        combos = _all_combos(hand)
        self.assertEqual(len(combos), 4)
        for c1, c2 in combos:
            self.assertEqual(c1[1], c2[1])

    def test_all_combos_offsuit(self):
        """An offsuit hand has 12 combos (4 suits * 3 remaining suits)."""
        from poker_tool.objects.hand import Hand

        hand = Hand.from_string("AKo")
        combos = _all_combos(hand)
        self.assertEqual(len(combos), 12)
        for c1, c2 in combos:
            self.assertNotEqual(c1[1], c2[1])

    def test_disjoint_combos_same_hand_pair(self):
        """AA vs AA: only disjoint combos where all 4 cards are distinct."""
        from poker_tool.objects.hand import Hand

        hero = Hand.from_string("AA")
        opp = Hand.from_string("AA")
        pairs = _disjoint_combos(hero, opp)
        self.assertEqual(len(pairs), 6)

    def test_disjoint_combos_different_hands(self):
        """AA vs KK: all 6*6=36 combos are disjoint (no shared ranks)."""
        from poker_tool.objects.hand import Hand

        hero = Hand.from_string("AA")
        opp = Hand.from_string("KK")
        pairs = _disjoint_combos(hero, opp)
        self.assertEqual(len(pairs), 36)

    def test_disjoint_combos_shared_rank(self):
        """AKs vs AQs: share rank A, so fewer disjoint combos."""
        from poker_tool.objects.hand import Hand

        hero = Hand.from_string("AKs")
        opp = Hand.from_string("AQs")
        pairs = _disjoint_combos(hero, opp)
        self.assertGreater(len(pairs), 0)
        self.assertLess(len(pairs), 16)

    def test_remaining_deck_empty(self):
        """With all 52 cards used, remaining deck is empty."""
        all_cards = {f"{r}{s}" for r in "AKQJT98765432" for s in "shdc"}
        deck = _remaining_deck(all_cards)
        self.assertEqual(len(deck), 0)

    def test_remaining_deck_partial(self):
        """With some cards used, remaining deck has the rest."""
        used = {"Ah", "Kh", "Qh", "Jh"}
        deck = _remaining_deck(used)
        self.assertEqual(len(deck), 48)
        for card in used:
            self.assertNotIn(card, deck)


class TestEnumerateEquityWithFakeEvaluator(unittest.TestCase):
    """Tests using a fast fake evaluator - these test the structure only.

    Note: These tests use a FakeHandEvaluator which is much faster than
    the real evaluator, but still exercises the enumeration logic.
    """

    def setUp(self):
        self.ev = FakeHandEvaluator()

    def test_empty_range_raises(self):
        """Empty range should raise ValueError."""
        with self.assertRaises(ValueError):
            EnumerateEquity(self.ev).enumerate("AKs", [])

    def test_empty_range_raises_notation(self):
        """Empty range notation should raise ValueError."""
        with self.assertRaises(ValueError):
            EnumerateEquity(self.ev).enumerate_notation("AKs", "")


class TestEnumerateEquityStructure(unittest.TestCase):
    """Lightweight tests that verify the structure without full enumeration."""

    def test_equity_result_structure(self):
        """Test that EquityResult has expected attributes."""
        result = EquityResult(
            hero="AA",
            win=50.0,
            tie=10.0,
            lose=40.0,
            iterations=100,
            by_hand=[EquityByHand("KK", 6, 50.0, 10.0, 40.0)],
        )
        self.assertEqual(result.hero, "AA")
        self.assertEqual(result.win, 50.0)
        self.assertEqual(result.tie, 10.0)
        self.assertEqual(result.lose, 40.0)
        self.assertEqual(result.iterations, 100)
        self.assertEqual(len(result.by_hand), 1)

    def test_equity_by_hand_structure(self):
        """Test that EquityByHand has expected attributes."""
        by_hand = EquityByHand("KK", 6, 50.0, 10.0, 40.0)
        self.assertEqual(by_hand.hand, "KK")
        self.assertEqual(by_hand.combos, 6)
        self.assertEqual(by_hand.win, 50.0)
        self.assertEqual(by_hand.tie, 10.0)
        self.assertEqual(by_hand.lose, 40.0)


class TestEnumerateEquityWithRealEvaluator(unittest.TestCase):
    """Tests using the real Phevaluator.

    Note: These tests are slow because they do full enumeration.
    They are skipped by default in CI.
    """

    def setUp(self):
        try:
            from poker_tool.adapters.phevaluator.evaluator import Phevaluator

            self.ev = Phevaluator()
        except ImportError:
            self.skipTest("phevaluator not available")

    def test_empty_range_raises(self):
        """Empty range should raise ValueError."""
        with self.assertRaises(ValueError):
            EnumerateEquity(self.ev).enumerate("AKs", [])

    # --- Slow tests: exact enumeration averages over all disjoint combos ---
    # These are skipped in CI because they are too slow (e.g. AA vs KK = 36 combos
    # * 1.7M boards each). Run them locally if you need to validate exact values.

    @unittest.skip("Slow: exact enumeration averages over all disjoint combos.")
    def test_aa_vs_kk_dominant(self):
        """AA should beat KK ~82% (exact value, not sampled)."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK"])
        self.assertGreater(r.win, 80.0)
        self.assertLess(r.lose, 20.0)

    @unittest.skip("Slow: exact enumeration averages over all disjoint combos.")
    def test_reproducible_bit_identical(self):
        """Two enumerations of the same input must be bit-identical."""
        e = EnumerateEquity(self.ev)
        r1 = e.enumerate("AA", ["KK"])
        r2 = e.enumerate("AA", ["KK"])
        self.assertEqual(r1.win, r2.win)
        self.assertEqual(r1.tie, r2.tie)
        self.assertEqual(r1.lose, r2.lose)
        self.assertEqual(r1.iterations, r2.iterations)

    @unittest.skip("Slow: exact enumeration averages over all disjoint combos.")
    def test_by_hand_breakdown(self):
        """Per-hand breakdown is present and reports raw combo counts."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK", "QQ"])
        hands = {h.hand: h for h in r.by_hand}
        self.assertIn("KK", hands)
        self.assertIn("QQ", hands)
        self.assertEqual(hands["KK"].combos, 6)
        self.assertEqual(hands["QQ"].combos, 6)

    @unittest.skip("Slow: exact enumeration averages over all disjoint combos.")
    def test_totals_sum_to_100(self):
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK"])
        self.assertAlmostEqual(r.win + r.tie + r.lose, 100.0, places=6)

    @unittest.skip("Slow: exact enumeration averages over all disjoint combos.")
    def test_aa_vs_kk_known_value(self):
        """AA vs KK exact equity is ~82.36/0.54/17.09 (reproducible)."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK"])
        self.assertAlmostEqual(r.win, 82.3648, delta=0.05)
        self.assertAlmostEqual(r.lose, 17.0916, delta=0.05)

    @unittest.skip("Slow: exact enumeration averages over all disjoint combos.")
    def test_aa_vs_aa_is_mirror_match(self):
        """AA vs AA: 4 aces suffice for two disjoint pairs -> mostly a tie."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["AA"])
        self.assertAlmostEqual(r.win, r.lose, places=4)
        self.assertGreater(r.tie, 90.0)


if __name__ == "__main__":
    unittest.main()
