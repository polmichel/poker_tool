"""Unit tests for the Deck value object."""
import random
import unittest

from poker_tool.objects.deck import Deck, RANKS, SUITS


class TestDeck(unittest.TestCase):
    """Tests for the Deck class."""

    def test_draw_returns_requested_count(self):
        """Test that draw returns the requested number of cards."""
        deck = Deck(rng=random.Random(0))
        cards = deck.draw(5)
        self.assertEqual(len(cards), 5)

    def test_excluded_cards_are_not_drawn(self):
        """Test that excluded cards never appear in the draw."""
        excluded = ["Ah", "As"]
        deck = Deck(excluded=excluded, rng=random.Random(0))
        for _ in range(20):
            cards = deck.draw(2)
            self.assertEqual(len(cards), 2)
            for card in cards:
                self.assertNotIn(card, excluded)

    def test_without_is_immutable(self):
        """Test that without() returns a new deck without mutating the original."""
        deck = Deck(excluded=["Ah"])
        new_deck = deck.without(["As"])
        self.assertEqual(deck.excluded, ["Ah"])
        self.assertEqual(new_deck.excluded, ["Ah", "As"])

    def test_draw_too_many_raises(self):
        """Test that drawing more than available raises ValueError."""
        deck = Deck(excluded=[f"{r}{s}" for r in RANKS for s in SUITS][:48])
        with self.assertRaises(ValueError):
            deck.draw(10)

    def test_rng_is_deterministic(self):
        """Test that the same seed produces the same draw."""
        d1 = Deck(rng=random.Random(123))
        d2 = Deck(rng=random.Random(123))
        self.assertEqual(d1.draw(5), d2.draw(5))


if __name__ == "__main__":
    unittest.main()
