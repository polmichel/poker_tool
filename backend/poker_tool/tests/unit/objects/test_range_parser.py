"""Unit tests for the range notation parser."""
import unittest

from poker_tool.objects.range_parser import (
    InvalidRangeNotation,
    parse_range,
)


class TestRangeParser(unittest.TestCase):
    """Tests for parse_range()."""

    def test_single_pair(self):
        """Test a single pair token."""
        self.assertEqual([str(h) for h in parse_range("QQ")], ["QQ"])

    def test_single_suited(self):
        """Test a single suited hand token."""
        self.assertEqual([str(h) for h in parse_range("AKs")], ["AKs"])

    def test_single_offsuit(self):
        """Test a single offsuit hand token."""
        self.assertEqual([str(h) for h in parse_range("AKo")], ["AKo"])

    def test_pair_plus(self):
        """Test 'QQ+' expands to QQ, KK, AA."""
        self.assertEqual([str(h) for h in parse_range("QQ+")], ["QQ", "KK", "AA"])

    def test_suited_plus(self):
        """Test 'ATs+' expands to ATs, AJs, AQs, AKs."""
        self.assertEqual(
            [str(h) for h in parse_range("ATs+")],
            ["ATs", "AJs", "AQs", "AKs"],
        )

    def test_offsuit_plus(self):
        """Test 'ATo+' expands to ATo, AJo, AQo, AKo."""
        self.assertEqual(
            [str(h) for h in parse_range("ATo+")],
            ["ATo", "AJo", "AQo", "AKo"],
        )

    def test_dash_range_same_high(self):
        """Test 'KTs-JTs' expands to KTs, QTs, JTs."""
        self.assertEqual(
            [str(h) for h in parse_range("KTs-JTs")],
            ["KTs", "QTs", "JTs"],
        )

    def test_dash_range_reversed(self):
        """Test that reversed bounds are normalized."""
        self.assertEqual(
            [str(h) for h in parse_range("JTs-KTs")],
            ["KTs", "QTs", "JTs"],
        )

    def test_mixed_notation(self):
        """Test a mixed range string with multiple tokens."""
        hands = [str(h) for h in parse_range("AKs, QQ+, ATs, KTs-JTs")]
        self.assertIn("AKs", hands)
        self.assertIn("QQ", hands)
        self.assertIn("KK", hands)
        self.assertIn("AA", hands)
        self.assertIn("ATs", hands)
        self.assertIn("KTs", hands)
        self.assertIn("JTs", hands)

    def test_dedup_preserves_order(self):
        """Test that duplicates are removed, keeping first-seen order."""
        self.assertEqual(
            [str(h) for h in parse_range("AKs,AKs,AKs")],
            ["AKs"],
        )

    def test_semicolon_and_newline_separators(self):
        """Test that semicolons and newlines are accepted as separators."""
        hands = [str(h) for h in parse_range("AKs;QQ\nAKo")]
        self.assertEqual(hands, ["AKs", "QQ", "AKo"])

    def test_empty_notation(self):
        """Test that an empty notation returns an empty list."""
        self.assertEqual(parse_range(""), [])
        self.assertEqual(parse_range("   "), [])

    def test_invalid_rank_raises(self):
        """Test that an unknown rank raises InvalidRangeNotation."""
        with self.assertRaises(InvalidRangeNotation):
            parse_range("ZZ")

    def test_invalid_plus_token_raises(self):
        """Test that an invalid plus token raises."""
        with self.assertRaises(InvalidRangeNotation):
            parse_range("AK+")

    def test_case_insensitive(self):
        """Test that notation is case-insensitive."""
        self.assertEqual([str(h) for h in parse_range("aks")], ["AKs"])

    def test_suited_plus_with_k_high(self):
        """Test 'KJs+' expands to KJs, KQs only (not KAs).

        KJs+ means suited hands with K as high and kicker >= J.
        Valid kickers: Q (index 2), J (index 3) - both < K (index 1).
        A (index 0) > K, so KAs is invalid (should be AKs).
        """
        self.assertEqual(
            [str(h) for h in parse_range("KJs+")],
            ["KJs", "KQs"],
        )

    def test_suited_plus_with_k_high_and_q_low(self):
        """Test 'KQs+' expands to KQs only.

        KQs+ means suited hands with K as high and kicker >= Q.
        Valid kicker: Q (index 2) only.
        J (index 3) < Q, so KJs is not included.
        A (index 0) > K, so KAs is invalid.
        """
        self.assertEqual(
            [str(h) for h in parse_range("KQs+")],
            ["KQs"],
        )

    def test_offsuit_plus_with_k_high(self):
        """Test 'KJo+' expands to KJo, KQo only (not KAo).

        KJo+ means offsuit hands with K as high and kicker >= J.
        Valid kickers: Q (index 2), J (index 3) - both < K (index 1).
        A (index 0) > K, so KAo is invalid (should be AKo).
        """
        self.assertEqual(
            [str(h) for h in parse_range("KJo+")],
            ["KJo", "KQo"],
        )

    def test_offsuit_plus_with_k_high_and_q_low(self):
        """Test 'KQo+' expands to KQo only.

        KQo+ means offsuit hands with K as high and kicker >= Q.
        Valid kicker: Q (index 2) only.
        J (index 3) < Q, so KJo is not included.
        A (index 0) > K, so KAo is invalid.
        """
        self.assertEqual(
            [str(h) for h in parse_range("KQo+")],
            ["KQo"],
        )


if __name__ == "__main__":
    unittest.main()
