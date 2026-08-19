"""
Generate the exact preflop equity table (hero vs opponent, canonical hands).

The table holds the exact preflop equity of every canonical hero hand (169)
against every canonical opponent hand (169): 169 x 169 = 28 561 entries. Each
entry is computed by *exhaustive* enumeration of all C(48,5) = 1 712 304
runouts for **every disjoint combo-pair** of the canonical pairing, then
averaged. Averaging over all disjoint combo-pairs is required for exactness:
suit symmetry does **not** hold in general, because some combo-pairs share a
rank between hero and opponent (e.g. AKo vs AKo, AKo vs AQo, AA vs AKs), and
the card-removal effect of the shared rank depends on the exact suits dealt.
A single representative combo-pair would therefore yield a non-representative
value; only the average over all disjoint combo-pairs is the exact equity.

Same-hand pairings (e.g. AA vs AA) are valid and included: four cards of a
rank are enough to deal two disjoint 2-card hands.

The table is written incrementally to ``backend/data/equity_table.json`` so a
long run can be interrupted and resumed (``--resume``): already-computed
entries are skipped. Concurrency uses ``multiprocessing`` to use all cores.

Usage:
    python -m poker_tool.scripts.generate_equity_table              # full run
    python -m poker_tool.scripts.generate_equity_table --resume     # continue
    python -m poker_tool.scripts.generate_equity_table --limit 20    # sample
"""
import argparse
import json
import os
from itertools import combinations
from multiprocessing import Pool

from phevaluator import Card, evaluate_cards

from ..objects.hand import RANKS, generate_all_hands

# Pre-computed card-string -> phevaluator int id (avoids per-call parsing).
_CARD_IDS: dict[str, int] = {
    f"{r}{s}": int(Card(f"{r}{s}")) for r in RANKS for s in "shdc"
}

TABLE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(
        os.path.abspath(__file__)
    ))),
    "data",
    "equity_table.json",
)

SUITS = ["s", "h", "d", "c"]


def _canonical_hands() -> list[str]:
    """All 169 canonical hands as notation strings (e.g. 'AKs', 'TT')."""
    return [str(h) for h in generate_all_hands()]


def _disjoint_combos(hero_hand: str, opp_hand: str) -> list[tuple[tuple[str, str], tuple[str, str]]]:
    """All disjoint (hero, opp) combo-pairs for a canonical pairing.

    Every valid combo-pair is enumerated (not just a representative one) so
    the equity can be averaged over them: suit symmetry does not hold for
    pairings that share a rank (card removal depends on the exact suits).
    Returns an empty list only for truly impossible pairings (none exist in
    the 169x169 grid, since every canonical hand has at least one disjoint
    combo against itself or any other).
    """
    pairs = []
    for hero_combo in _all_combos(hero_hand):
        hero_used = {hero_combo[0], hero_combo[1]}
        for opp_combo in _all_combos(opp_hand):
            if opp_combo[0] not in hero_used and opp_combo[1] not in hero_used:
                pairs.append((hero_combo, opp_combo))
    return pairs


def _all_combos(hand_str: str) -> list[tuple[str, str]]:
    """All real-card combos for a canonical hand."""
    r1, r2 = hand_str[0], hand_str[1]
    if len(hand_str) == 2:  # pair: C(4,2)=6
        return [
            (f"{r1}{SUITS[i]}", f"{r1}{SUITS[j]}")
            for i in range(4) for j in range(i + 1, 4)
        ]
    suited = len(hand_str) == 3 and hand_str[2] == "s"
    if suited:
        return [(f"{r1}{s}", f"{r2}{s}") for s in SUITS]
    # offsuit: distinct suits, 4*3=12 (order matters for hero/opp separation)
    return [
        (f"{r1}{SUITS[i]}", f"{r2}{SUITS[j]}")
        for i in range(4) for j in range(4) if i != j
    ]


def _enumerate_combo(hero_combo, opp_combo) -> tuple[int, int, int]:
    """Exhaustively enumerate one disjoint combo-pair -> (wins, ties, losses)."""
    hole = (_CARD_IDS[hero_combo[0]], _CARD_IDS[hero_combo[1]])
    opp = (_CARD_IDS[opp_combo[0]], _CARD_IDS[opp_combo[1]])
    used = {hero_combo[0], hero_combo[1], opp_combo[0], opp_combo[1]}
    remaining = [
        _CARD_IDS[f"{r}{s}"]
        for r in RANKS for s in SUITS
        if f"{r}{s}" not in used
    ]
    wins = ties = losses = 0
    for board in combinations(remaining, 5):
        hero_eval = evaluate_cards(
            hole[0], hole[1], board[0], board[1], board[2], board[3], board[4]
        )
        opp_eval = evaluate_cards(
            opp[0], opp[1], board[0], board[1], board[2], board[3], board[4]
        )
        if hero_eval < opp_eval:
            wins += 1
        elif hero_eval == opp_eval:
            ties += 1
        else:
            losses += 1
    return wins, ties, losses


def _enumerate_entry(args: tuple[str, str]) -> tuple[str, str, dict]:
    """Enumerate one (hero, opp) canonical pair -> exact win/tie/lose.

    Averages the exhaustive enumeration over **all** disjoint combo-pairs of
    the canonical pairing. Each combo-pair has exactly C(48,5) = 1 712 304
    boards, so summing the raw counts and dividing by the total board count
    yields the exact preflop equity of the canonical pairing. This is
    required because suit symmetry does not hold for pairings sharing a rank.

    Returns (hero_str, opp_str, {"win":..,"tie":..,"lose":..,"boards":..}).
    """
    hero_hand, opp_hand = args
    pairs = _disjoint_combos(hero_hand, opp_hand)
    if not pairs:
        return (hero_hand, opp_hand, {"win": 0.0, "tie": 0.0, "lose": 0.0, "boards": 0})
    total_wins = total_ties = total_losses = 0
    for hero_combo, opp_combo in pairs:
        wins, ties, losses = _enumerate_combo(hero_combo, opp_combo)
        total_wins += wins
        total_ties += ties
        total_losses += losses
    total = total_wins + total_ties + total_losses
    return (hero_hand, opp_hand, {
        "win": total_wins / total * 100,
        "tie": total_ties / total * 100,
        "lose": total_losses / total * 100,
        "boards": total,
    })


def _load_existing(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, dict) else {}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--resume", action="store_true",
                        help="Skip entries already present in the table file.")
    parser.add_argument("--limit", type=int, default=None,
                        help="Only compute the first N pairs (for sampling).")
    parser.add_argument("--workers", type=int, default=None,
                        help="Number of worker processes (default: cpu_count).")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(TABLE_PATH), exist_ok=True)
    table = _load_existing(TABLE_PATH) if args.resume else {}

    hands = _canonical_hands()
    jobs = []
    for hero in hands:
        for opp in hands:
            # Same-hand pairings (e.g. AA vs AA) are valid: four cards of a
            # rank suffice for two disjoint 2-card hands. Do NOT skip them.
            key = f"{hero}|{opp}"
            if key in table:
                continue
            jobs.append((hero, opp))

    if args.limit:
        jobs = jobs[: args.limit]
    if not jobs:
        print("Nothing to compute (all entries present).")
        return

    workers = args.workers or os.cpu_count() or 1
    print(f"Computing {len(jobs)} entries with {workers} workers...")
    print(f"Output: {TABLE_PATH}")

    done = 0
    with Pool(workers) as pool:
        # chunksize=1 so we can checkpoint progress periodically.
        for hero, opp, result in pool.imap_unordered(_enumerate_entry, jobs, chunksize=1):
            table[f"{hero}|{opp}"] = result
            done += 1
            if done % 50 == 0 or done == len(jobs):
                # Checkpoint after each batch so an interruption is resumable.
                with open(TABLE_PATH, "w", encoding="utf-8") as f:
                    json.dump(table, f)
                print(f"  {done}/{len(jobs)} done ({hero} vs {opp}) -> "
                      f"win={result['win']:.2f} tie={result['tie']:.2f} "
                      f"lose={result['lose']:.2f})")

    with open(TABLE_PATH, "w", encoding="utf-8") as f:
        json.dump(table, f)
    print(f"Finished. {len(table)} entries written to {TABLE_PATH}")


if __name__ == "__main__":
    main()
