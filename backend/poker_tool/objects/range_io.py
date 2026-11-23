"""
Range import/export serialization (Elegant Objects).

Pure functions converting between a ``Range`` and the formats supported by
the import/export UI:

  - ``json``: the full range dictionary (name, description, range_type,
    position, hands).
  - ``text``: one entry per line, ``"<hands>: <action>"`` where ``<hands>``
    accepts the range notation of :mod:`range_parser` (e.g. ``"66+, A8s+: open"``).
    Lines starting with ``#`` are ignored.
  - ``csv``: a ``hand,action`` header followed by one entry per row.

All helpers raise :class:`InvalidImportContent` / :class:`InvalidExportFormat`
on invalid input so the web layer can map them to HTTP 400.
"""

import csv
import io
import json

from .action import ActionType
from .hand import Hand
from .position import Position
from .range import Range
from .range_parser import InvalidRangeNotation, parse_range
from .range_type import RangeType

SUPPORTED_FORMATS = ("json", "text", "csv")

DEFAULT_RANGE_NAME = "Range importée"


class InvalidImportContent(Exception):
    """Raised when imported content cannot be parsed into a range."""


class InvalidExportFormat(Exception):
    """Raised when an export format is not supported."""


def _expand_hands(field: str, where: str) -> list[str]:
    try:
        hands = parse_range(field)
    except InvalidRangeNotation as exc:
        raise InvalidImportContent(f"{where}: {exc}") from exc
    if not hands:
        raise InvalidImportContent(f"{where}: no hands in '{field.strip()}'")
    return [str(hand) for hand in hands]


def _normalize_action(token: str, where: str) -> str:
    try:
        return ActionType[token.strip().upper()].name
    except KeyError as exc:
        raise InvalidImportContent(f"{where}: invalid action '{token.strip()}'") from exc


def _normalize_range_type(value: str) -> str:
    try:
        return RangeType[value.strip().upper()].name
    except KeyError as exc:
        raise InvalidImportContent(f"Invalid range_type: '{value}'") from exc


def _normalize_position(value: str) -> str:
    text = value.strip()
    try:
        return Position[text.upper()].name
    except KeyError:
        pass
    position = Position.from_string(text)
    if position is Position.UNDEFINED and text.upper() != "UNDEFINED":
        raise InvalidImportContent(f"Invalid position: '{value}'")
    return position.name


def _parse_json(content: str) -> dict:
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise InvalidImportContent(f"Invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise InvalidImportContent("JSON content must be an object")
    payload: dict = {}
    if "name" in data:
        payload["name"] = str(data["name"])
    if "description" in data:
        payload["description"] = str(data["description"])
    if "range_type" in data:
        payload["range_type"] = _normalize_range_type(str(data["range_type"]))
    if "position" in data:
        payload["position"] = _normalize_position(str(data["position"]))
    if "effective_stack_bb" in data:
        payload["effective_stack_bb"] = data["effective_stack_bb"]
    hands_raw = data.get("hands", {})
    if not isinstance(hands_raw, dict):
        raise InvalidImportContent("'hands' must be an object mapping hands to actions")
    hands: dict[str, str] = {}
    for hand_field, action in hands_raw.items():
        action_name = _normalize_action(str(action), f"hand '{hand_field}'")
        for hand in _expand_hands(str(hand_field), f"hand '{hand_field}'"):
            hands[hand] = action_name
    payload["hands"] = hands
    return payload


def _parse_text(content: str) -> dict:
    hands: dict[str, str] = {}
    for lineno, raw in enumerate(content.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if ":" in line:
            hand_field, _, action = line.partition(":")
        elif "," in line:
            hand_field, _, action = line.partition(",")
        else:
            raise InvalidImportContent(f"Line {lineno}: expected '<hands>: <action>', got '{line}'")
        action_name = _normalize_action(action, f"line {lineno}")
        for hand in _expand_hands(hand_field, f"line {lineno}"):
            hands[hand] = action_name
    if not hands:
        raise InvalidImportContent("No hands found in content")
    return {"hands": hands}


def _parse_csv(content: str) -> dict:
    reader = csv.reader(io.StringIO(content))
    rows = [row for row in reader if any(cell.strip() for cell in row)]
    if not rows:
        raise InvalidImportContent("Empty CSV content")
    header = [cell.strip().lower() for cell in rows[0]]
    if "hand" not in header or "action" not in header:
        raise InvalidImportContent("CSV header must contain 'hand' and 'action' columns")
    hand_idx, action_idx = header.index("hand"), header.index("action")
    hands: dict[str, str] = {}
    for lineno, row in enumerate(rows[1:], start=2):
        if len(row) <= max(hand_idx, action_idx):
            raise InvalidImportContent(f"Line {lineno}: expected hand and action columns")
        action_name = _normalize_action(row[action_idx], f"line {lineno}")
        for hand in _expand_hands(row[hand_idx], f"line {lineno}"):
            hands[hand] = action_name
    if not hands:
        raise InvalidImportContent("No hands found in CSV content")
    return {"hands": hands}


def parse_import(content: str, fmt: str = "json", name: str | None = None) -> dict:
    """Parse imported content into a payload for ``Range.from_dict``.

    The returned dict uses canonical enum names so ``Range.from_dict`` accepts
    it directly. Hands are normalized (e.g. ``ka s`` -> ``AKs``) and range
    notation (``66+``, ``A8s+``, ``KTs-JTs``) is expanded.
    """
    if not isinstance(content, str) or not content.strip():
        raise InvalidImportContent("Content is empty")
    fmt = (fmt or "json").strip().lower()
    if fmt not in SUPPORTED_FORMATS:
        raise InvalidImportContent(f"Unsupported format '{fmt}'. Supported: {', '.join(SUPPORTED_FORMATS)}")
    if fmt == "json":
        payload = _parse_json(content)
    elif fmt == "text":
        payload = _parse_text(content)
    else:
        payload = _parse_csv(content)
    if not payload.get("name"):
        payload["name"] = name or DEFAULT_RANGE_NAME
    return payload


def _sorted_hands(range_obj: Range) -> list[tuple[str, str]]:
    def sort_key(item: tuple[str, str]):
        try:
            return (0, Hand.from_string(item[0]))
        except (ValueError, IndexError):
            return (1, item[0])

    return sorted(((hand, str(action)) for hand, action in range_obj.hands.items()), key=sort_key)


def serialize_range(range_obj: Range, fmt: str = "json"):
    """Serialize a range for export.

    ``json`` returns the range dictionary itself; ``text`` and ``csv`` return
    ``{"text": ...}`` / ``{"csv": ...}`` payloads matching the frontend.
    """
    fmt = (fmt or "json").strip().lower()
    if fmt == "json":
        return range_obj.to_dict()
    if fmt == "text":
        lines = [f"{hand}: {action}" for hand, action in _sorted_hands(range_obj)]
        return {"text": "\n".join(lines) + ("\n" if lines else "")}
    if fmt == "csv":
        buffer = io.StringIO()
        writer = csv.writer(buffer, lineterminator="\n")
        writer.writerow(["hand", "action"])
        for hand, action in _sorted_hands(range_obj):
            writer.writerow([hand, action])
        return {"csv": buffer.getvalue()}
    raise InvalidExportFormat(f"Unsupported format '{fmt}'. Supported: {', '.join(SUPPORTED_FORMATS)}")


__all__ = [
    "DEFAULT_RANGE_NAME",
    "SUPPORTED_FORMATS",
    "InvalidExportFormat",
    "InvalidImportContent",
    "parse_import",
    "serialize_range",
]
