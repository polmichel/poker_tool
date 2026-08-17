"""Unit tests for the SimulateEquity use case."""
import random
import unittest

from poker_tool.use_cases.simulate_equity import SimulateEquity


class TestSimulateEquity(unittest.TestCase):
    """Tests for SimulateEquity."""

    def _sim(self, seed=0, **kwargs):
        return SimulateEquity(rng=random.Random(seed)).simulate(**kwargs)

    def test_aa_vs_kk_is_dominant(self):
        """AA should beat KK ~80% of the time."""
        r = self._sim(seed=1, hero="AA", range_hands=["KK"], iterations=3000)
        self.assertGreater(r.win, 75.0)
        self.assertLess(r.lose, 22.0)
        self.assertEqual(r.iterations, 3000)

    def test_ak_vs_qq_near_coinflip(self):
        """AKs vs QQ should be a coinflip (~46/54)."""
        r = self._sim(seed=2, hero="AKs", range_hands=["QQ"], iterations=3000)
        self.assertGreater(r.win, 40.0)
        self.assertLess(r.win, 52.0)
        self.assertGreater(r.lose, 40.0)

    def test_by_hand_breakdown_present(self):
        """Test that per-hand breakdown is returned."""
        r = self._sim(seed=3, hero="AKs", range_hands=["QQ", "KK"], iterations=2000)
        hands = {h.hand: h for h in r.by_hand}
        self.assertIn("QQ", hands)
        self.assertIn("KK", hands)
        self.assertEqual(hands["QQ"].combos, 6)
        self.assertEqual(hands["KK"].combos, 6)

    def test_deterministic_with_seed(self):
        """Test that the same seed yields identical results."""
        r1 = SimulateEquity(rng=random.Random(42)).simulate(
            hero="AKs", range_hands=["QQ"], iterations=500,
        )
        r2 = SimulateEquity(rng=random.Random(42)).simulate(
            hero="AKs", range_hands=["QQ"], iterations=500,
        )
        self.assertEqual(r1.win, r2.win)
        self.assertEqual(r1.tie, r2.tie)
        self.assertEqual(r1.lose, r2.lose)

    def test_empty_range_raises(self):
        """Test that an empty range raises ValueError."""
        with self.assertRaises(ValueError):
            self._sim(hero="AKs", range_hands=[], iterations=100)

    def test_invalid_iterations_raises(self):
        """Test that non-positive iterations raises ValueError."""
        with self.assertRaises(ValueError):
            self._sim(hero="AKs", range_hands=["QQ"], iterations=0)

    def test_simulate_notation(self):
        """Test the notation convenience method."""
        sim = SimulateEquity(rng=random.Random(5))
        r = sim.simulate_notation("AKs", "QQ+, ATs+", iterations=2000)
        self.assertGreater(r.iterations, 0)
        # Range QQ+, ATs+ expands to at least QQ,KK,AA + ATs,AJs,AQs,AKs.
        hands = {h.hand for h in r.by_hand}
        self.assertIn("QQ", hands)
        self.assertIn("AA", hands)
        self.assertIn("AKs", hands)

    def test_totals_sum_to_100(self):
        """Test that win + tie + lose ≈ 100."""
        r = self._sim(seed=7, hero="AKs", range_hands=["QQ"], iterations=2000)
        self.assertAlmostEqual(r.win + r.tie + r.lose, 100.0, places=1)


if __name__ == "__main__":
    unittest.main()
