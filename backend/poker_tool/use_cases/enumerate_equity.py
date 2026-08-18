"""
Exact equity enumeration of a hero hand against an opposing range (use case).

Unlike :class:`SimulateEquity` (Monte-Carlo sampling), this use case enumerates
*every* possible runout so the result is exact and fully reproducible: running
the computation twice yields bit-identical values (no variance, no seed).

Preflop, hero vs a single opposing hand, the number of 5-card boards is
C(48, 5) = 1 712 304 once the two 2-card hands are fixed and disjoint. By suit
symmetry (verified empirically: every valid combo-pair of a canonical hero-vs-
opp pairing yields the same equity), it is sufficient to enumerate the boards
for a single representative disjoint combo-pair per canonical pairing. The
result is the exact preflop equity of the canonical hero hand against the
canonical opponent hand.

The evaluator is injected (Elegant Objects): this use case is free of any
external library dependency and is testable with a fake evaluator. The output
type (``EquityResult``) is identical to :class:`SimulateEquity` so the frontend
and controllers are unchanged. For bulk generation of the full 169x169 table,
use :mod:`poker_tool.scripts.generate_equity_table` (multiprocessing).
"""
from itertools import combinations

from ..interfaces.hand_evaluator import HandEvaluator
from ..objects.deck import RANKS, SUITS
from ..objects.equity import EquityByHand, EquityResult, hand_combos
from ..objects.hand import Hand
from ..objects.range_parser import parse_range


def _all_combos(hand: Hand) -> list[tuple[str, str]]:
    """All real-card combos for a canonical hand."""
    r1, r2 = hand.rank1, hand.rank2
    if hand.is_pair:
        return [
            (f"{r1}{SUITS[i]}", f"{r1}{SUITS[j]}")
            for i in range(len(SUITS))
            for j in range(i + 1, len(SUITS))
        ]
    if hand.suited:
        return [(f"{r1}{s}", f"{r2}{s}") for s in SUITS]
    return [
        (f"{r1}{SUITS[i]}", f"{r2}{SUITS[j]}")
        for i in range(len(SUITS))
        for j in range(len(SUITS))
        if i != j
    ]


def _disjoint_combo(hero_hand: Hand, opp_hand: Hand) -> tuple[tuple[str, str], tuple[str, str]] | None:
    """A representative disjoint (hero, opp) combo-pair, or None if impossible.

    Some canonical pairings have no disjoint combo (e.g. hero AA vs opp AA is
    impossible: only 4 aces exist). Those are skipped.
    """
    for hero_combo in _all_combos(hero_hand):
        hero_used = {hero_combo[0], hero_combo[1]}
        for opp_combo in _all_combos(opp_hand):
            if opp_combo[0] not in hero_used and opp_combo[1] not in hero_used:
                return (hero_combo, opp_combo)
    return None


def _remaining_deck(used: set[str]) -> list[str]:
    """All 52 cards minus the used ones, as 2-char strings."""
    return [
        f"{r}{s}" for r in RANKS for s in SUITS if f"{r}{s}" not in used
    ]


class EnumerateEquity:
    """Exact preflop equity of a hero hand against a range (full enumeration)."""

    def __init__(self, evaluator: HandEvaluator) -> None:
        self._evaluator = evaluator

    def enumerate(self, hero: str, range_hands: list[str]) -> EquityResult:
        """Enumerate every runout and return the exact aggregated equity.

        ``range_hands`` is a list of canonical hand notations (already expanded).
        ``hero`` is a single canonical hand notation (e.g. 'AKs').

        The result is exact (no sampling) and fully reproducible.
        """
        if not range_hands:
            raise ValueError("Range contains no hands")

        hero_hand = Hand.from_string(hero)

        per_hand: dict[tuple[str, str, bool], dict[str, int]] = {}
        total_wins = total_ties = total_losses = 0

        for notation in range_hands:
            opp = Hand.from_string(notation)
            key = (opp.rank1, opp.rank2, opp.suited)
            pair = _disjoint_combo(hero_hand, opp)
            if pair is None:
                per_hand[key] = {"win": 0, "tie": 0, "lose": 0}
                continue

            hero_combo, opp_combo = pair
            used = {hero_combo[0], hero_combo[1], opp_combo[0], opp_combo[1]}
            deck = _remaining_deck(used)
            hole_hero = [hero_combo[0], hero_combo[1]]
            hole_opp = [opp_combo[0], opp_combo[1]]

            wins = ties = losses = 0
            for board in combinations(deck, 5):
                board_list = list(board)
                hero_eval = self._evaluator.evaluate(hole_hero, board_list)
                opp_eval = self._evaluator.evaluate(hole_opp, board_list)
                if hero_eval < opp_eval:
                    wins += 1
                elif hero_eval == opp_eval:
                    ties += 1
                else:
                    losses += 1
            per_hand[key] = {"win": wins, "tie": ties, "lose": losses}
            total_wins += wins
            total_ties += ties
            total_losses += losses

        total = total_wins + total_ties + total_losses
        if total == 0:
            raise ValueError("No valid enumeration completed")

        by_hand: list[EquityByHand] = []
        for notation in range_hands:
            opp = Hand.from_string(notation)
            key = (opp.rank1, opp.rank2, opp.suited)
            combos = hand_combos(opp.rank1, opp.rank2, opp.suited)
            stats = per_hand[key]
            sub = stats["win"] + stats["tie"] + stats["lose"]
            if sub == 0:
                by_hand.append(EquityByHand(str(opp), combos, 0.0, 0.0, 0.0))
                continue
            by_hand.append(EquityByHand(
                str(opp), combos,
                stats["win"] / sub * 100,
                stats["tie"] / sub * 100,
                stats["lose"] / sub * 100,
            ))

        return EquityResult(
            hero=str(hero_hand),
            win=total_wins / total * 100,
            tie=total_ties / total * 100,
            lose=total_losses / total * 100,
            iterations=total,
            by_hand=by_hand,
        )

    def enumerate_notation(self, hero: str, range_notation: str) -> EquityResult:
        """Convenience: parse the range notation then enumerate."""
        hands = parse_range(range_notation)
        return self.enumerate(hero, [str(h) for h in hands])
