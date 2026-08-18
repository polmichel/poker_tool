"""
Exact equity aggregation of a hero hand against an opposing range (use case).

Combines the pre-computed exact per-hand equity table (:class:`EquityTable`)
into an aggregated win/tie/lose against a full range, weighted by the number
of real-card combos still available after excluding the hero's hole cards.

Unlike :class:`SimulateEquity` (Monte-Carlo) and :class:`EnumerateEquity`
(full enumeration at call time), this use case only reads the pre-computed
table: aggregation is instant and the result is exact (bit-identical on every
call, no variance, no seed).

The hero's exact hole cards matter for combo weighting (e.g. hero ``AhKh``
facing ``AKs`` leaves only 3 suited combos, not 4). Because the canonical hero
notation (``AKs``) does not fix suits, we pick a representative hero combo
(first available) and count the opponent combos that do not share a card with
it — this is the standard preflop combo-counting convention.
"""
from ..objects.equity import EquityByHand, EquityResult, available_combos
from ..objects.equity_table import EquityTable
from ..objects.hand import Hand
from ..objects.range_parser import parse_range

_SUITS = ["s", "h", "d", "c"]


def _hero_card_combos(hand: Hand) -> list[tuple[str, str]]:
    """All real-card combos for a canonical hero hand."""
    r1, r2 = hand.rank1, hand.rank2
    if hand.is_pair:
        return [
            (f"{r1}{_SUITS[i]}", f"{r1}{_SUITS[j]}")
            for i in range(len(_SUITS))
            for j in range(i + 1, len(_SUITS))
        ]
    if hand.suited:
        return [(f"{r1}{s}", f"{r2}{s}") for s in _SUITS]
    return [
        (f"{r1}{_SUITS[i]}", f"{r2}{_SUITS[j]}")
        for i in range(len(_SUITS))
        for j in range(len(_SUITS))
        if i != j
    ]


class AggregateEquity:
    """Aggregate the exact per-hand table against a range (instant, exact)."""

    def __init__(self, table: EquityTable) -> None:
        self._table = table

    def aggregate(self, hero: str, range_hands: list[str]) -> EquityResult:
        """Aggregate the table lookups into an exact range equity.

        ``range_hands`` is a list of canonical hand notations (already expanded).
        ``hero`` is a single canonical hand notation (e.g. 'AKs').

        The result is exact and identical on every call (no sampling).
        """
        if not range_hands:
            raise ValueError("Range contains no hands")

        hero_hand = Hand.from_string(hero)
        # Use the first hero combo as representative for combo weighting.
        hero_combo = _hero_card_combos(hero_hand)[0]
        hero_cards = {hero_combo[0], hero_combo[1]}

        # Weighted sums: for each opponent hand, weight = available combos.
        total_weight = 0.0
        win_sum = tie_sum = lose_sum = 0.0
        by_hand: list[EquityByHand] = []

        for notation in range_hands:
            opp = Hand.from_string(notation)
            entry = self._table.lookup(hero, notation)
            weight = available_combos(
                opp.rank1, opp.rank2, opp.suited, hero_cards
            )
            if entry is None or weight == 0:
                # Pairing impossible (e.g. AA vs AA) or no combo available.
                by_hand.append(EquityByHand(str(opp), weight, 0.0, 0.0, 0.0))
                continue
            by_hand.append(EquityByHand(
                str(opp), weight,
                entry["win"], entry["tie"], entry["lose"],
            ))
            win_sum += entry["win"] * weight
            tie_sum += entry["tie"] * weight
            lose_sum += entry["lose"] * weight
            total_weight += weight

        if total_weight == 0:
            raise ValueError("No valid pairings in range")

        return EquityResult(
            hero=str(hero_hand),
            win=win_sum / total_weight,
            tie=tie_sum / total_weight,
            lose=lose_sum / total_weight,
            iterations=self._table.size,
            by_hand=by_hand,
        )

    def aggregate_notation(self, hero: str, range_notation: str) -> EquityResult:
        """Convenience: parse the range notation then aggregate."""
        hands = parse_range(range_notation)
        return self.aggregate(hero, [str(h) for h in hands])
