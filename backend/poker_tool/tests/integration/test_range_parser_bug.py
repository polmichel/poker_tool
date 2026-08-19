"""Integration test to reproduce the KJs+ bug.

The issue: KJs+ should expand to [KJs, KQs] only, not [KJs, KQs, KAs].
KAs is invalid because A > K, so the hand should be AKs, not KAs.

Similarly, KQo+ should expand to [KQo] only, not [KQo, KAo].
"""
import unittest

from poker_tool.objects.range_parser import parse_range


class TestRangeParserBug(unittest.TestCase):
    """Integration tests for range parser bugs."""

    def test_kjs_plus_should_not_include_kas(self):
        """KJs+ should only include KJs and KQs, not KAs.

        KJs+ means: suited hands with K as high and kicker >= J.
        Valid kickers for K: Q, J (both < K in rank order).
        A is > K, so KAs is invalid (should be AKs).
        """
        hands = [str(h) for h in parse_range("KJs+")]
        # Should be KJs, KQs only
        self.assertEqual(hands, ["KJs", "KQs"])
        # KAs should NOT be in the result
        self.assertNotIn("KAs", hands)

    def test_kqs_plus_should_not_include_kas(self):
        """KQs+ should only include KQs, not KJs, KAs.

        KQs+ means: suited hands with K as high and kicker >= Q.
        Valid kicker for K: Q only (since A > K, J < Q).
        """
        hands = [str(h) for h in parse_range("KQs+")]
        # Should be KQs only
        self.assertEqual(hands, ["KQs"])

    def test_kas_should_be_normalized_to_aks(self):
        """KAs as a single hand should be normalized to AKs."""
        # When parsing a single hand, KAs should be treated as AKs
        # because A > K, so A is the high rank
        hands = [str(h) for h in parse_range("KAs")]
        self.assertEqual(hands, ["AKs"])

    def test_ats_plus_still_works(self):
        """ATs+ should still work correctly (ATs, AJs, AQs, AKs)."""
        hands = [str(h) for h in parse_range("ATs+")]
        self.assertEqual(hands, ["ATs", "AJs", "AQs", "AKs"])

    def test_kjo_plus_offsuit_should_not_include_kao(self):
        """KJo+ should only include KJo, KQo, not KAo."""
        hands = [str(h) for h in parse_range("KJo+")]
        # Valid kickers for K: Q, J (both < K in rank order)
        # A > K, so KAo is invalid (should be AKo)
        # KJo+ means kicker >= J, so Q (index 2) and J (index 3) are both valid
        self.assertEqual(hands, ["KJo", "KQo"])
        self.assertNotIn("KAo", hands)

    def test_kqs_plus_offsuit_should_not_include_kao(self):
        """KQo+ should only include KQo, not KJo, KAo."""
        hands = [str(h) for h in parse_range("KQo+")]
        # Valid kicker for K: Q only (J < Q in rank order)
        # A > K, so KAo is invalid (should be AKo)
        # KQo+ means kicker >= Q, so only Q (index 2) is valid
        self.assertEqual(hands, ["KQo"])
        self.assertNotIn("KAo", hands)
        self.assertNotIn("KJo", hands)

    def test_full_range_from_issue(self):
        """Test the full range from the issue: QQ+, ATs+, AJo+, KJs+, KQo+"""
        range_notation = "QQ+, ATs+, AJo+, KJs+, KQo+"
        hands = [str(h) for h in parse_range(range_notation)]

        # Expected hands:
        # QQ, KK, AA (from QQ+)
        # ATs, AJs, AQs, AKs (from ATs+)
        # AJo, AQo, AKo (from AJo+)
        # KJs, KQs (from KJs+) - NOT KAs (KAs is normalized to AKs)
        # KQo (from KQo+) - KQo+ means kicker >= Q, so only Q is valid for K

        expected = [
            "QQ", "KK", "AA",
            "ATs", "AJs", "AQs", "AKs",
            "AJo", "AQo", "AKo",
            "KJs", "KQs",
            "KQo",
        ]

        # Sort both for comparison
        self.assertEqual(sorted(hands), sorted(expected))

        # Specifically check that KAs and KAo are NOT in the result
        self.assertNotIn("KAs", hands)
        self.assertNotIn("KAo", hands)


if __name__ == "__main__":
    unittest.main()
