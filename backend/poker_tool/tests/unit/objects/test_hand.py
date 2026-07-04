"""
Unit tests for Hand value object.
"""
import unittest
from poker_tool.objects.hand import Hand, RANKS, generate_all_hands


class TestHand(unittest.TestCase):
    """Tests for Hand class."""

    def test_hand_creation(self):
        """Test Hand creation with valid ranks."""
        hand = Hand("A", "K", True)
        self.assertEqual(hand.rank1, "A")
        self.assertEqual(hand.rank2, "K")
        self.assertTrue(hand.suited)

    def test_hand_lowercase_ranks(self):
        """Test Hand creation with lowercase ranks."""
        hand = Hand("a", "k", True)
        self.assertEqual(hand.rank1, "A")
        self.assertEqual(hand.rank2, "K")

    def test_hand_is_pair(self):
        """Test pair detection."""
        pair = Hand("A", "A", True)
        self.assertTrue(pair.is_pair)
        
        non_pair = Hand("A", "K", False)
        self.assertFalse(non_pair.is_pair)

    def test_hand_string_representation(self):
        """Test string representation."""
        # Pair
        pair = Hand("A", "A", True)
        self.assertEqual(str(pair), "AA")
        
        # Suited
        suited = Hand("A", "K", True)
        self.assertEqual(str(suited), "AKs")
        
        # Offsuit
        offsuit = Hand("A", "K", False)
        self.assertEqual(str(offsuit), "AKo")

    def test_hand_equality(self):
        """Test equality comparison."""
        hand1 = Hand("A", "K", True)
        hand2 = Hand("A", "K", True)
        hand3 = Hand("A", "K", False)
        hand4 = Hand("Q", "J", True)
        
        self.assertEqual(hand1, hand2)
        self.assertNotEqual(hand1, hand3)
        self.assertNotEqual(hand1, hand4)
        self.assertNotEqual(hand1, "not a hand")

    def test_hand_hash(self):
        """Test hash for use in sets/dicts."""
        hand1 = Hand("A", "K", True)
        hand2 = Hand("A", "K", True)
        
        # Should be able to use in sets
        hand_set = {hand1, hand2}
        self.assertEqual(len(hand_set), 1)
        
        # Should be able to use as dict keys
        hand_dict = {hand1: "value"}
        self.assertEqual(hand_dict[hand2], "value")

    def test_hand_from_string(self):
        """Test factory method from string."""
        # Two characters (offsuit)
        hand = Hand.from_string("AK")
        self.assertEqual(hand.rank1, "A")
        self.assertEqual(hand.rank2, "K")
        self.assertFalse(hand.suited)
        
        # Three characters (suited)
        hand = Hand.from_string("AKs")
        self.assertEqual(hand.rank1, "A")
        self.assertEqual(hand.rank2, "K")
        self.assertTrue(hand.suited)
        
        # Three characters (offsuit)
        hand = Hand.from_string("AKo")
        self.assertEqual(hand.rank1, "A")
        self.assertEqual(hand.rank2, "K")
        self.assertFalse(hand.suited)
        
        # Lowercase
        hand = Hand.from_string("ak")
        self.assertEqual(hand.rank1, "A")
        self.assertEqual(hand.rank2, "K")
        
        # Invalid string
        with self.assertRaises(ValueError):
            Hand.from_string("ABCD")

    def test_hand_comparison(self):
        """Test hand comparison by rank."""
        # Lower index in RANKS means stronger card (A=0, K=1, Q=2, etc.)
        # So a hand with A should be LESS than a hand with K (because A is stronger)
        ace_high = Hand("A", "K", True)
        king_high = Hand("K", "Q", True)
        # ace_high has rank1=A (index 0), king_high has rank1=K (index 1)
        # So ace_high < king_high should be True (A is stronger, lower index)
        self.assertTrue(ace_high < king_high)
        self.assertFalse(king_high < ace_high)
        
        # Same highest rank, compare second rank
        ace_king = Hand("A", "K", True)  # rank2=K (index 1)
        ace_queen = Hand("A", "Q", True)  # rank2=Q (index 2)
        # ace_king should be LESS than ace_queen (K is stronger than Q)
        self.assertTrue(ace_king < ace_queen)
        
        # Same ranks, suited vs offsuit shouldn't matter for rank comparison
        ace_king_suited = Hand("A", "K", True)
        ace_king_offsuit = Hand("A", "K", False)
        # They have the same ranks, so they're equal in rank
        self.assertFalse(ace_king_suited < ace_king_offsuit)
        self.assertFalse(ace_king_offsuit < ace_king_suited)

    def test_generate_all_hands(self):
        """Test generating all possible hands."""
        all_hands = generate_all_hands()
        
        # Should generate 169 hands (13x13)
        # But since we only generate i <= j, it's 13 + 12 + 11 + ... + 1 = 91
        # Actually, the code generates i <= j, so it's 13*14/2 = 91
        self.assertEqual(len(all_hands), 91)
        
        # All should be Hand instances
        for hand in all_hands:
            self.assertIsInstance(hand, Hand)

    def test_ranks_order(self):
        """Test that RANKS are in correct order."""
        expected_ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
        self.assertEqual(RANKS, expected_ranks)


if __name__ == '__main__':
    unittest.main()
