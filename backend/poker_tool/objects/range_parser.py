"""
Range notation parser (Elegant Objects).

Expands poker range notation into a canonical list of ``Hand`` objects:

  - ``AKs``      -> single suited hand
  - ``QQ``       -> single pair
  - ``QQ+``      -> QQ, KK, AA (pairs equal or better)
  - ``ATs+``     -> ATs, AJs, AQs, AKs (suited connectors of same high rank)
  - ``KTs-JTs``  -> KTs, QTs, JTs (suited gap range)

Supported separators: comma, semicolon, space, newline.
"""
from .hand import RANKS, Hand


class InvalidRangeNotation(Exception):
    """Raised when a range token cannot be parsed."""


def _rank_index(rank: str) -> int:
    try:
        return RANKS.index(rank.upper())
    except ValueError as exc:
        raise InvalidRangeNotation(f"Unknown rank: {rank}") from exc


def _parse_single(token: str) -> list[Hand]:
    """Parse a 2-3 char hand token (no range operators)."""
    token = token.upper()
    if len(token) in (2, 3) and all(c in RANKS for c in token[:2]):
        return [Hand.from_string(token)]
    raise InvalidRangeNotation(f"Invalid hand token: {token}")


def _expand_pair_plus(rank: str) -> list[Hand]:
    """Expand 'QQ+' -> QQ, KK, AA (ascending order)."""
    idx = _rank_index(rank)
    return [Hand(r, r, False) for r in reversed(RANKS[:idx + 1])]


def _expand_suited_plus(high: str, low: str) -> list[Hand]:
    """Expand 'ATs+' -> ATs, AJs, AQs, AKs (kickers >= low, same high)."""
    high_idx = _rank_index(high)
    low_idx = _rank_index(low)
    if high_idx >= low_idx:
        raise InvalidRangeNotation(f"Invalid plus range: {high}{low}s+")
    # Kickers at least as good as `low` (index <= low_idx), excluding the pair,
    # and lower than high in rank order (index > high_idx).
    kickers = [
        RANKS[k] for k in range(low_idx, -1, -1)
        if RANKS[k] != high and k > high_idx
    ]
    return [Hand(high, k, True) for k in kickers]


def _expand_offsuit_plus(high: str, low: str) -> list[Hand]:
    """Expand 'ATo+' -> ATo, AJo, AQo, AKo."""
    high_idx = _rank_index(high)
    low_idx = _rank_index(low)
    if high_idx >= low_idx:
        raise InvalidRangeNotation(f"Invalid plus range: {high}{low}o+")
    kickers = [RANKS[k] for k in range(low_idx, -1, -1) if RANKS[k] != high and k > high_idx]
    return [Hand(high, k, False) for k in kickers]


def _expand_dash_range(token: str) -> list[Hand]:
    """Expand a 'HiLis-HjLjs' range (same suitedness, same high or same low)."""
    left, right = token.split("-")
    left, right = left.upper(), right.upper()
    if len(left) != 3 or len(right) != 3:
        raise InvalidRangeNotation(f"Only suited/offsuit dash ranges supported: {token}")
    if left[2] != right[2]:
        raise InvalidRangeNotation(f"Mixed suitedness in dash range: {token}")
    suited = left[2] == "S"

    lh, ll = left[0], left[1]
    rh, rl = right[0], right[1]

    if lh == rh:
        # Same high rank, vary kicker: KTs-JTs -> KTs QTs JTs
        high = lh
        start = _rank_index(ll)
        end = _rank_index(rl)
        if start < end:
            start, end = end, start
        kickers = RANKS[end:start + 1]
        return [Hand(high, k, suited) for k in kickers if k != high]
    if ll == rl:
        # Same low (kicker), vary high: 75s-95s -> 95s 85s 75s
        low = ll
        start = _rank_index(lh)
        end = _rank_index(rh)
        if start < end:
            start, end = end, start
        highs = RANKS[end:start + 1]
        return [Hand(h, low, suited) for h in highs if h != low]
    raise InvalidRangeNotation(f"Unsupported dash range shape: {token}")


def parse_range(notation: str) -> list[Hand]:
    """Parse a range notation string into a list of canonical hands.

    Hands are deduplicated while preserving first-seen order.
    """
    if not notation or not notation.strip():
        return []

    seen: list[Hand] = []
    seen_keys: set[tuple[str, str, bool]] = set()

    for raw in notation.replace(";", ",").replace("\n", ",").split(","):
        token = raw.strip()
        if not token:
            continue

        if token.endswith("+"):
            base = token[:-1].upper()
            if len(base) == 2 and base[0] == base[1]:
                hands = _expand_pair_plus(base[0])
            elif len(base) == 3 and base[2] in ("S", "O") and base[0] != base[1]:
                if base[2] == "S":
                    hands = _expand_suited_plus(base[0], base[1])
                else:
                    hands = _expand_offsuit_plus(base[0], base[1])
            else:
                raise InvalidRangeNotation(f"Invalid plus token: {token}")
        elif "-" in token:
            hands = _expand_dash_range(token)
        else:
            hands = _parse_single(token)

        for hand in hands:
            key = (hand.rank1, hand.rank2, hand.suited)
            if key not in seen_keys:
                seen_keys.add(key)
                seen.append(hand)

    return seen
