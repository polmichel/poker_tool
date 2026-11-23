"""
Unit tests for range import/export serialization (objects/range_io.py).
"""

import json
import os
import sys
import unittest

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from poker_tool.objects.action import Action, ActionType
from poker_tool.objects.position import Position
from poker_tool.objects.range import Range
from poker_tool.objects.range_io import (
    InvalidExportFormat,
    InvalidImportContent,
    parse_import,
    serialize_range,
)
from poker_tool.objects.range_type import RangeType


def _make_range() -> Range:
    return Range(
        name="BTN open",
        description="Ouverture bouton",
        range_type=RangeType.PREFLOP,
        position=Position.BTN,
        hands={
            "AA": Action(ActionType.OPEN),
            "AKs": Action(ActionType.OPEN),
            "72o": Action(ActionType.CALL),
        },
        range_id=7,
    )


class TestParseImportText(unittest.TestCase):
    """Text format: '<hands>: <action>' per line, '#' comments ignored."""

    def test_simple_lines(self):
        payload = parse_import("AA: open\nKK: open\nAKs: raise", "text")
        self.assertEqual(payload["hands"], {"AA": "OPEN", "KK": "OPEN", "AKs": "RAISE"})
        self.assertEqual(payload["name"], "Range importée")

    def test_range_notation_is_expanded(self):
        payload = parse_import("66+, A8s+: open", "text")
        self.assertIn("66", payload["hands"])
        self.assertIn("AA", payload["hands"])
        self.assertIn("A8s", payload["hands"])
        self.assertIn("AKs", payload["hands"])
        self.assertNotIn("A7s", payload["hands"])
        self.assertTrue(all(action == "OPEN" for action in payload["hands"].values()))

    def test_dash_range_is_expanded(self):
        payload = parse_import("KTs-JTs: call", "text")
        self.assertEqual(set(payload["hands"]), {"KTs", "QTs", "JTs"})

    def test_hands_are_normalized(self):
        payload = parse_import("kas: open\naqo: call\nKQ: raise", "text")
        self.assertEqual(payload["hands"], {"AKs": "OPEN", "AQo": "CALL", "KQo": "RAISE"})

    def test_comments_and_blank_lines_ignored(self):
        payload = parse_import("# ma range\n\nAA: open\n", "text")
        self.assertEqual(payload["hands"], {"AA": "OPEN"})

    def test_comma_separator_accepted(self):
        payload = parse_import("AA, open", "text")
        self.assertEqual(payload["hands"], {"AA": "OPEN"})

    def test_explicit_name_wins_over_default(self):
        payload = parse_import("AA: open", "text", name="Ma range")
        self.assertEqual(payload["name"], "Ma range")

    def test_invalid_line_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("AA open", "text")

    def test_invalid_action_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("AA: dance", "text")

    def test_invalid_hand_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("XX: open", "text")

    def test_empty_content_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("   \n  ", "text")


class TestParseImportCsv(unittest.TestCase):
    """CSV format: 'hand,action' header + rows."""

    def test_csv_with_header(self):
        payload = parse_import("hand,action\nAA,open\nKK,open\n72o,call", "csv")
        self.assertEqual(payload["hands"], {"AA": "OPEN", "KK": "OPEN", "72o": "CALL"})

    def test_csv_header_case_insensitive_and_extra_columns(self):
        payload = parse_import("Hand,Action,Note\nAA,open,x", "csv")
        self.assertEqual(payload["hands"], {"AA": "OPEN"})

    def test_csv_plus_notation(self):
        payload = parse_import("hand,action\n66+,open", "csv")
        self.assertIn("AA", payload["hands"])
        self.assertIn("66", payload["hands"])

    def test_csv_missing_header_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("AA,open", "csv")

    def test_csv_bad_action_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("hand,action\nAA,dance", "csv")


class TestParseImportJson(unittest.TestCase):
    """JSON format: full range object."""

    def test_full_payload(self):
        content = json.dumps(
            {
                "name": "UTG open",
                "description": "Ouverture UTG",
                "range_type": "preflop",
                "position": "UTG+1",
                "hands": {"AA": "open", "AKs": "open"},
            }
        )
        payload = parse_import(content, "json")
        self.assertEqual(payload["name"], "UTG open")
        self.assertEqual(payload["description"], "Ouverture UTG")
        self.assertEqual(payload["range_type"], "PREFLOP")
        self.assertEqual(payload["position"], "UTG_PLUS_1")
        self.assertEqual(payload["hands"], {"AA": "OPEN", "AKs": "OPEN"})

    def test_json_notation_keys_expanded(self):
        payload = parse_import(json.dumps({"name": "x", "hands": {"66+": "open"}}), "json")
        self.assertIn("AA", payload["hands"])

    def test_invalid_json_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("{not json", "json")

    def test_non_object_json_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("[1, 2]", "json")

    def test_invalid_range_type_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import(json.dumps({"hands": {}, "range_type": "turbo"}), "json")

    def test_invalid_position_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import(json.dumps({"hands": {}, "position": "MP"}), "json")

    def test_hands_must_be_object(self):
        with self.assertRaises(InvalidImportContent):
            parse_import(json.dumps({"hands": ["AA"]}), "json")


class TestParseImportFormat(unittest.TestCase):
    def test_unknown_format_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("AA: open", "xml")

    def test_format_is_case_insensitive(self):
        payload = parse_import("AA: open", "TEXT")
        self.assertEqual(payload["hands"], {"AA": "OPEN"})

    def test_empty_content_raises(self):
        with self.assertRaises(InvalidImportContent):
            parse_import("", "json")


class TestSerializeRange(unittest.TestCase):
    def test_json_returns_range_dict(self):
        result = serialize_range(_make_range(), "json")
        self.assertEqual(result["name"], "BTN open")
        self.assertEqual(result["position"], "BTN")
        self.assertEqual(result["hands"], {"AA": "open", "AKs": "open", "72o": "call"})

    def test_text_format(self):
        result = serialize_range(_make_range(), "text")
        self.assertIn("text", result)
        lines = result["text"].strip().splitlines()
        self.assertEqual(set(lines), {"AA: open", "AKs: open", "72o: call"})

    def test_csv_format(self):
        result = serialize_range(_make_range(), "csv")
        self.assertIn("csv", result)
        rows = result["csv"].strip().splitlines()
        self.assertEqual(rows[0], "hand,action")
        self.assertEqual(set(rows[1:]), {"AA,open", "AKs,open", "72o,call"})

    def test_unknown_format_raises(self):
        with self.assertRaises(InvalidExportFormat):
            serialize_range(_make_range(), "xml")

    def test_round_trip_text(self):
        range_obj = _make_range()
        exported = serialize_range(range_obj, "text")["text"]
        payload = parse_import(exported, "text", name=range_obj.name)
        self.assertEqual(payload["hands"], {k: v.type.name for k, v in range_obj.hands.items()})

    def test_round_trip_csv(self):
        range_obj = _make_range()
        exported = serialize_range(range_obj, "csv")["csv"]
        payload = parse_import(exported, "csv")
        self.assertEqual(payload["hands"], {k: v.type.name for k, v in range_obj.hands.items()})

    def test_round_trip_json(self):
        range_obj = _make_range()
        exported = serialize_range(range_obj, "json")
        payload = parse_import(json.dumps(exported), "json")
        self.assertEqual(payload["hands"], {k: v.type.name for k, v in range_obj.hands.items()})
        self.assertEqual(payload["name"], range_obj.name)
        self.assertEqual(payload["position"], range_obj.position.name)


if __name__ == "__main__":
    unittest.main()
