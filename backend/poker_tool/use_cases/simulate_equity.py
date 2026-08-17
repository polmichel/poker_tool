"""
Simulate equity of a hero hand against an opposing range (use case).

Pure Monte-Carlo: for each iteration we pick a random opponent hand from the
range (weighted by real-card combos), deal the missing board cards from the
remaining deck, and evaluate the two 7-card hands via the injected
:class:`HandEvaluator` port. The result is aggregated win/tie/lose plus a
per-hand breakdown.

The evaluator is injected (Elegant Objects): the use case is free of any
external library dependency and can be tested with a fake evaluator, and the
evaluation backend can be swapped (treys -> PokerKit -> custom) by adding a new
adapter without touching this file.
"""
import random

from ..interfaces.hand_evaluator import HandEvaluator
from ..objects.deck import Deck, RANKS, SUITS
from ..objects.equity import EquityByHand, EquityResult, hand_combos
from ..objects.hand import Hand
from ..objects.range_parser import parse_range


def _hand_to_card_strings(hand: Hand) -> list[str]:
    """Expand a canonical hand into all its real-card ('Ah') combos."""
    r1, r2 = hand.rank1, hand.rank2
    if hand.is_pair:
        combos = []
        for i in range(len(SUITS)):
            for j in range(i + 1, len(SUITS)):
                combos.append(f"{r1}{SUITS[i]}{r1}{SUITS[j]}")
        return combos
    if hand.suited:
        return [f"{r1}{s}{r2}{s}" for s in SUITS]
    # Offsuit: distinct suits for the two ranks.
    combos = []
    for i in range(len(SUITS)):
        for j in range(len(SUITS)):
            if i != j:
                combos.append(f"{r1}{SUITS[i]}{r2}{SUITS[j]}")
    return combos


def _card_string_split(card_str: str) -> list[str]:
    """Split a 4-char 'AhKs' string into ['Ah', 'Ks']."""
    return [card_str[:2], card_str[2:]]


class SimulateEquity:
    """Simulate the equity of a hero hand against a range (Monte-Carlo)."""

    def __init__(self, evaluator: HandEvaluator,
                 rng: random.Random | None = None) -> None:
        self._evaluator = evaluator
        self._rng = rng or random.Random()

    def simulate(self, hero: str, range_hands: list[str],
                 iterations: int = 10000) -> EquityResult:
        """Run the simulation and return the aggregated equity.

        ``range_hands`` is a list of canonical hand notations (already expanded).
        ``hero`` is a single canonical hand notation (e.g. 'AKs').
        """
        if iterations <= 0:
            raise ValueError("iterations must be positive")

        hero_hand = Hand.from_string(hero)
        # Build the weighted opponent pool: (hand, [card_strings], combos).
        opponents: list[tuple[Hand, list[str], int]] = []
        for notation in range_hands:
            opp = Hand.from_string(notation)
            combos = hand_combos(opp.rank1, opp.rank2, opp.suited)
            card_combos = _hand_to_card_strings(opp)
            opponents.append((opp, card_combos, combos))

        if not opponents:
            raise ValueError("Range contains no hands")

        total_weight = sum(c for _, _, c in opponents)

        # Per-hand counters.
        per_hand: dict[tuple[str, str, bool], dict[str, int]] = {}
        for opp, _, _ in opponents:
            key = (opp.rank1, opp.rank2, opp.suited)
            per_hand[key] = {"win": 0, "tie": 0, "lose": 0, "total": 0}

        wins = ties = losses = 0
        hero_card_combos = _hand_to_card_strings(hero_hand)

        for _ in range(iterations):
            # Pick a weighted random opponent hand.
            pick = self._rng.randint(1, total_weight)
            acc = 0
            chosen = None
            for opp, card_combos, combos in opponents:
                acc += combos
                if pick <= acc:
                    chosen = (opp, card_combos)
                    break
            opp_hand, opp_card_combos = chosen  # type: ignore[assignment]

            # Pick concrete card combos for hero and opponent.
            hero_cards = self._rng.choice(hero_card_combos)
            opp_cards = self._rng.choice(opp_card_combos)

            # Ensure the two hands don't share a card (possible for pair vs pair,
            # same rank offsuit, etc.); resample if they collide.
            hero_pair = _card_string_split(hero_cards)
            opp_pair = _card_string_split(opp_cards)
            attempts = 0
            while set(hero_pair) & set(opp_pair) and attempts < 50:
                opp_cards = self._rng.choice(opp_card_combos)
                opp_pair = _card_string_split(opp_cards)
                attempts += 1
            if set(hero_pair) & set(opp_pair):
                # Collision unavoidable for this combo pairing; skip iteration.
                continue

            excluded = hero_pair + opp_pair
            deck = Deck(excluded=excluded, rng=self._rng)
            board = deck.draw(5)

            hero_eval = self._evaluator.evaluate(hero_pair, board)
            opp_eval = self._evaluator.evaluate(opp_pair, board)

            key = (opp_hand.rank1, opp_hand.rank2, opp_hand.suited)
            if hero_eval < opp_eval:
                wins += 1
                per_hand[key]["win"] += 1
            elif hero_eval == opp_eval:
                ties += 1
                per_hand[key]["tie"] += 1
            else:
                losses += 1
                per_hand[key]["lose"] += 1
            per_hand[key]["total"] += 1

        effective = wins + ties + losses
        if effective == 0:
            raise ValueError("No valid simulation iterations completed")

        win_pct = wins / effective * 100
        tie_pct = ties / effective * 100
        lose_pct = losses / effective * 100

        by_hand: list[EquityByHand] = []
        for opp, _, combos in opponents:
            key = (opp.rank1, opp.rank2, opp.suited)
            stats = per_hand[key]
            total = stats["total"]
            if total == 0:
                by_hand.append(EquityByHand(str(opp), combos, 0.0, 0.0, 0.0))
                continue
            by_hand.append(EquityByHand(
                str(opp), combos,
                stats["win"] / total * 100,
                stats["tie"] / total * 100,
                stats["lose"] / total * 100,
            ))

        return EquityResult(
            hero=str(hero_hand),
            win=win_pct,
            tie=tie_pct,
            lose=lose_pct,
            iterations=effective,
            by_hand=by_hand,
        )

    def simulate_notation(self, hero: str, range_notation: str,
                          iterations: int = 10000) -> EquityResult:
        """Convenience: parse the range notation then simulate."""
        hands = parse_range(range_notation)
        return self.simulate(hero, [str(h) for h in hands], iterations)
