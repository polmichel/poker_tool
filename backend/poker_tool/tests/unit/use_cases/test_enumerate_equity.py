"""Unit tests for the EnumerateEquity use case (exact enumeration)."""
import unittest

from poker_tool.adapters.phevaluator.evaluator import Phevaluator
from poker_tool.use_cases.enumerate_equity import EnumerateEquity


class TestEnumerateEquity(unittest.TestCase):
    """Tests for EnumerateEquity (exact, reproducible)."""

    def setUp(self):
        self.ev = Phevaluator()

    def test_aa_vs_kk_dominant(self):
        """AA should beat KK ~82% (exact value, not sampled)."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK"])
        self.assertGreater(r.win, 80.0)
        self.assertLess(r.lose, 20.0)
        # Exact enumeration: each pairing has C(48,5) = 1 712 304 boards.
        self.assertEqual(r.iterations, 1712304)

    def test_reproducible_bit_identical(self):
        """Two enumerations of the same input must be bit-identical."""
        e = EnumerateEquity(self.ev)
        r1 = e.enumerate("AA", ["KK"])
        r2 = e.enumerate("AA", ["KK"])
        self.assertEqual(r1.win, r2.win)
        self.assertEqual(r1.tie, r2.tie)
        self.assertEqual(r1.lose, r2.lose)
        self.assertEqual(r1.iterations, r2.iterations)

    def test_by_hand_breakdown(self):
        """Per-hand breakdown is present and reports raw combo counts."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK", "QQ"])
        hands = {h.hand: h for h in r.by_hand}
        self.assertIn("KK", hands)
        self.assertIn("QQ", hands)
        self.assertEqual(hands["KK"].combos, 6)
        self.assertEqual(hands["QQ"].combos, 6)

    def test_empty_range_raises(self):
        with self.assertRaises(ValueError):
            EnumerateEquity(self.ev).enumerate("AKs", [])

    def test_totals_sum_to_100(self):
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK"])
        self.assertAlmostEqual(r.win + r.tie + r.lose, 100.0, places=6)

    def test_aa_vs_kk_known_value(self):
        """AA vs KK exact equity is ~82.36/0.54/17.09 (reproducible)."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["KK"])
        self.assertAlmostEqual(r.win, 82.3648, delta=0.05)
        self.assertAlmostEqual(r.lose, 17.0916, delta=0.05)

    def test_aa_vs_aa_is_mirror_match(self):
        """AA vs AA: 4 aces suffice for two disjoint pairs -> mostly a tie."""
        r = EnumerateEquity(self.ev).enumerate("AA", ["AA"])
        self.assertAlmostEqual(r.win, r.lose, places=4)  # symmetric
        self.assertGreater(r.tie, 90.0)  # mirror match -> dominant tie


if __name__ == "__main__":
    unittest.main()
