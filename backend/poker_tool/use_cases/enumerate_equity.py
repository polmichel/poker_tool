"""
Exact equity enumeration of a hero hand against an opposing range (use case).

Unlike :class:`SimulateEquity` (Monte-Carlo sampling), this use case enumerates
*every* possible runout so the result is exact and fully reproducible: running
the computation twice yields bit-identical values (no variance, no seed).

Preflop, hero vs a single opposing hand, the number of 5-card boards per
disjoint combo-pair is C(48, 5) = 1 712 304. Suit symmetry does **not** hold
in general: some combo-pairs share a rank between hero and opponent (e.g. AKo
vs AKo, AKo vs AQo, AA vs AKs), and the card-removal effect of the shared rank
depends on the exact suits dealt. A single representative combo-pair would
therefore yield a non-representative value. This use case enumerates the
boards for **every** disjoint combo-pair of the canonical pairing and averages
them (summing the raw win/tie/lose counts over all combo-pairs, then dividing
by the total board count), which is the exact preflop equity of the canonical
hero hand against the canonical opponent hand.

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


def _disjoint_combos(hero_hand: Hand, opp_hand: Hand) -> list[tuple[tuple[str, str], tuple[str, str]]]:
    """All disjoint (hero, opp) combo-pairs for a canonical pairing.

    Every valid combo-pair is enumerated (not just a representative one) so
    the equity can be averaged over them: suit symmetry does not hold for
    pairings that share a rank (card removal depends on the exact suits).
    Returns an empty list for impossible pairings (none exist in the 169x169
    grid, since every canonical hand has at least one disjoint combo against
    itself or any other); callers treat an empty result as a zero equity.
    """
    pairs = []
    for hero_combo in _all_combos(hero_hand):
        hero_used = {hero_combo[0], hero_combo[1]}
        for opp_combo in _all_combos(opp_hand):
            if opp_combo[0] not in hero_used and opp_combo[1] not in hero_used:
                pairs.append((hero_combo, opp_combo))
    return pairs


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

        For each opposing hand, the boards are enumerated for **every**
        disjoint combo-pair and averaged, so the result is exact even when
        suit symmetry does not hold (pairings sharing a rank). The result is
        fully reproducible (no sampling).
        """
        if not range_hands:
            raise ValueError("Range contains no hands")

        hero_hand = Hand.from_string(hero)

        per_hand: dict[tuple[str, str, bool], dict[str, int]] = {}
        total_wins = total_ties = total_losses = 0

        for notation in range_hands:
            opp = Hand.from_string(notation)
            key = (opp.rank1, opp.rank2, opp.suited)
            pairs = _disjoint_combos(hero_hand, opp)
            if not pairs:
                per_hand[key] = {"win": 0, "tie": 0, "lose": 0}
                continue

            wins = ties = losses = 0
            for hero_combo, opp_combo in pairs:
                used = {hero_combo[0], hero_combo[1], opp_combo[0], opp_combo[1]}
                deck = _remaining_deck(used)
                hole_hero = [hero_combo[0], hero_combo[1]]
                hole_opp = [opp_combo[0], opp_combo[1]]
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
