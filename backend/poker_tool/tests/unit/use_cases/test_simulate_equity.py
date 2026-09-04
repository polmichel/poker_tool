"""Unit tests for the SimulateEquity use case."""
import random
import unittest

from poker_tool.adapters.treys.evaluator import TreysEvaluator
from poker_tool.interfaces.hand_evaluator import HandEvaluator
from poker_tool.tests.unit.use_cases.fakes import FakeHandEvaluator
from poker_tool.use_cases.simulate_equity import (
    SimulateEquity,
    _card_string_split,
    _hand_to_card_strings,
)


class FakeDeterministicEvaluator(HandEvaluator):
    """Deterministic evaluator that always returns the same value for testing."""
    
    def evaluate(self, hole_cards, board):
        # Return a deterministic value based on the first card's rank
        ranks = {'A': 0, 'K': 1, 'Q': 2, 'J': 3, 'T': 4, '9': 5, '8': 6, '7': 7, 
                '6': 8, '5': 9, '4': 10, '3': 11, '2': 12}
        return ranks.get(hole_cards[0][0], 13)


class TestHelperFunctions(unittest.TestCase):
    """Tests for internal helper functions in simulate_equity."""

    def test_hand_to_card_strings_pair(self):
        """Test _hand_to_card_strings for a pair hand."""
        from poker_tool.objects.hand import Hand
        hand = Hand.from_string("AA")
        card_strings = _hand_to_card_strings(hand)
        self.assertEqual(len(card_strings), 6)  # C(4,2) = 6
        # All should be pairs of Aces
        for cs in card_strings:
            self.assertEqual(cs[0], cs[2])  # Same rank
            self.assertNotEqual(cs[1], cs[3])  # Different suits

    def test_hand_to_card_strings_suited(self):
        """Test _hand_to_card_strings for a suited hand."""
        from poker_tool.objects.hand import Hand
        hand = Hand.from_string("AKs")
        card_strings = _hand_to_card_strings(hand)
        self.assertEqual(len(card_strings), 4)  # 4 suits
        # All should have the same suit
        for cs in card_strings:
            self.assertEqual(cs[1], cs[3])

    def test_hand_to_card_strings_offsuit(self):
        """Test _hand_to_card_strings for an offsuit hand."""
        from poker_tool.objects.hand import Hand
        hand = Hand.from_string("AKo")
        card_strings = _hand_to_card_strings(hand)
        self.assertEqual(len(card_strings), 12)  # 4 * 3 = 12
        # All should have different suits
        for cs in card_strings:
            self.assertNotEqual(cs[1], cs[3])

    def test_card_string_split(self):
        """Test _card_string_split splits 4-char string into two 2-char strings."""
        result = _card_string_split("AhKs")
        self.assertEqual(result, ["Ah", "Ks"])
        
        result = _card_string_split("QdJh")
        self.assertEqual(result, ["Qd", "Jh"])


class TestSimulateEquity(unittest.TestCase):
    """Tests for SimulateEquity."""

    def _sim(self, seed=0, **kwargs):
        return SimulateEquity(TreysEvaluator(), rng=random.Random(seed)).simulate(**kwargs)

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
        r1 = SimulateEquity(TreysEvaluator(), rng=random.Random(42)).simulate(
            hero="AKs", range_hands=["QQ"], iterations=500,
        )
        r2 = SimulateEquity(TreysEvaluator(), rng=random.Random(42)).simulate(
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
        sim = SimulateEquity(TreysEvaluator(), rng=random.Random(5))
        r = sim.simulate_notation("AKs", "QQ+, ATs+", iterations=2000)
        self.assertGreater(r.iterations, 0)
        # Range QQ+, ATs+ expands to at least QQ,KK,AA + ATs,AJs,AQs,AKs.
        hands = {h.hand for h in r.by_hand}
        self.assertIn("QQ", hands)
        self.assertIn("AA", hands)
        self.assertIn("AKs", hands)

    def test_totals_sum_to_100(self):
        """Test that win + tie + lose ~ 100."""
        r = self._sim(seed=7, hero="AKs", range_hands=["QQ"], iterations=2000)
        self.assertAlmostEqual(r.win + r.tie + r.lose, 100.0, places=1)


    def test_works_with_fake_evaluator(self):
        """Test that the use case works with any HandEvaluator (decoupling)."""
        sim = SimulateEquity(FakeHandEvaluator(), rng=random.Random(0))
        r = sim.simulate("AKs", ["QQ"], iterations=500)
        # With the fake (ranks by hole card index), AKs (A=0) beats QQ (Q=2).
        self.assertGreater(r.win, 90.0)
        self.assertEqual(r.iterations, 500)


if __name__ == "__main__":
    unittest.main()
