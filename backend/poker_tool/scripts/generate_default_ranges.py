"""
Generate the default preflop ranges shipped in ``ranges/preflop/``.

Each range is described in compact range notation (expanded with
:func:`poker_tool.objects.range_parser.parse_range`) and written twice:

  - ``<slug>.json``: full range object, importable via the JSON tab.
  - ``<slug>.txt``: ``"<notation>: <action>"`` lines, importable via the Text tab.

The ranges are standard 6-max raise-first-in (RFI) opening charts (~2.5bb,
100bb) plus BB defense vs a BTN open, intended as training material.

Usage:
    python -m poker_tool.scripts.generate_default_ranges
"""

import json
import os

from ..objects.position import Position
from ..objects.range_parser import parse_range
from ..objects.range_type import RangeType

# (slug, name, description, position, [(notation, action), ...])
DEFAULT_RANGES = [
    (
        "utg-open",
        "UTG open 6-max",
        "Range d'ouverture UTG en 6-max (RFI ~2.5bb)",
        Position.UTG,
        [
            ("77+", "open"),
            ("A9s+, KTs+, QTs+, JTs, T9s, 98s, 87s, 76s, 65s", "open"),
            ("ATo+, KJo+, QJo+", "open"),
        ],
    ),
    (
        "utg1-open",
        "UTG+1 open 6-max",
        "Range d'ouverture UTG+1 en 6-max (RFI ~2.5bb)",
        Position.UTG_PLUS_1,
        [
            ("66+", "open"),
            ("A8s+, K9s+, Q9s+, J9s+, T9s, 98s, 87s, 76s, 65s, 54s", "open"),
            ("ATo+, KJo+, QTo+, QJo+", "open"),
        ],
    ),
    (
        "lj-open",
        "LJ open 6-max",
        "Range d'ouverture LJ en 6-max (RFI ~2.5bb)",
        Position.LJ,
        [
            ("55+", "open"),
            ("A7s+, K9s+, Q9s+, J8s+, T8s+, 98s, 97s, 87s, 76s, 65s, 54s", "open"),
            ("A9o+, KTo+, QTo+, JTo", "open"),
        ],
    ),
    (
        "hj-open",
        "HJ open 6-max",
        "Range d'ouverture HJ en 6-max (RFI ~2.5bb)",
        Position.HJ,
        [
            ("44+", "open"),
            ("A5s+, K8s+, Q8s+, J8s+, T7s+, 97s, 86s, 76s, 65s, 54s, 43s", "open"),
            ("A8o+, KTo+, QTo+, JTo, T9o", "open"),
        ],
    ),
    (
        "co-open",
        "CO open 6-max",
        "Range d'ouverture CO en 6-max (RFI ~2.5bb)",
        Position.CO,
        [
            ("33+", "open"),
            ("A4s+, K7s+, Q8s+, J7s+, T6s+, 96s, 85s, 75s, 64s, 54s, 43s, 32s", "open"),
            ("A7o+, K9o+, Q9o+, J9o+, T8o+", "open"),
        ],
    ),
    (
        "btn-open",
        "BTN open 6-max",
        "Range d'ouverture BTN en 6-max (RFI ~2.5bb)",
        Position.BTN,
        [
            ("22+", "open"),
            ("A2s+, K5s+, Q7s+, J6s+, T6s+, 96s+, 85s+, 75s+, 64s+, 54s, 43s, 32s", "open"),
            ("K8o+, Q9o+, J8o+, T8o+", "open"),
        ],
    ),
    (
        "sb-open",
        "SB open 6-max",
        "Range d'ouverture SB en 6-max (RFI ~2.5bb)",
        Position.SB,
        [
            ("22+", "open"),
            ("A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s, 32s", "open"),
            ("K4o+, Q7o+, J6o+, T6o+", "open"),
        ],
    ),
    (
        "bb-vs-btn-3bet",
        "BB vs BTN 3-bet 6-max",
        "Range de 3-bet de la BB contre une ouverture du BTN en 6-max",
        Position.BB,
        [
            ("77+, A5s+, ATo+, K9s+, KJo+, Q9s+, QJo+, J9s+, T9s", "raise"),
        ],
    ),
    (
        "bb-vs-btn-call",
        "BB vs BTN call 6-max",
        "Range de call de la BB contre une ouverture du BTN en 6-max",
        Position.BB,
        [
            ("22, 33, 44, 55, 66", "call"),
            ("A2s-A4s, A2o-A9o", "call"),
            ("K2s-K8s, K2o-K8o, K9o-KTo", "call"),
            ("Q5s-Q9s, Q9o-QJo", "call"),
            ("J7s-JTs, J9o-JTo", "call"),
            ("T6s-T9s, T8o-T9o", "call"),
            ("98s, 97s, 87s, 86s, 76s, 65s, 54s, 43s, 32s", "call"),
        ],
    ),
]


def _output_dir() -> str:
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    return os.path.join(repo_root, "ranges", "preflop")


def build_payload(slug: str, name: str, description: str, position: Position, entries: list) -> dict:
    hands: dict[str, str] = {}
    for notation, action in entries:
        for hand in parse_range(notation):
            hands[str(hand)] = action
    return {
        "name": name,
        "description": description,
        "range_type": RangeType.PREFLOP.name.lower(),
        "position": position.name,
        "hands": dict(sorted(hands.items())),
    }


def main() -> None:
    out_dir = _output_dir()
    os.makedirs(out_dir, exist_ok=True)
    for slug, name, description, position, entries in DEFAULT_RANGES:
        payload = build_payload(slug, name, description, position, entries)
        with open(os.path.join(out_dir, f"{slug}.json"), "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        with open(os.path.join(out_dir, f"{slug}.txt"), "w", encoding="utf-8") as fh:
            fh.write(f"# {name}\n# {description}\n")
            for notation, action in entries:
                fh.write(f"{notation}: {action}\n")
        print(f"{slug}: {len(payload['hands'])} mains -> {out_dir}")


if __name__ == "__main__":
    main()
