"""Unit tests for EquityTable (reader) and AggregateEquity."""
import json
import os
import tempfile
import unittest

from poker_tool.objects.equity_table import EquityTable
from poker_tool.use_cases.aggregate_equity import AggregateEquity


def _sample_table() -> dict:
    """A minimal in-memory table for testing (AA vs a few hands).

    Values are exact (computed via EnumerateEquity(Phevaluator())) but only a
    handful of entries are included so the test is fast.
    """
    return {
        "AA|AKo": {"win": 92.7967, "tie": 1.3474, "lose": 5.8559, "boards": 1712304},
        "AA|AKs": {"win": 87.2316, "tie": 1.2558, "lose": 11.5126, "boards": 1712304},
        "AA|AJo": {"win": 91.9334, "tie": 1.3192, "lose": 6.7475, "boards": 1712304},
        "AA|KK": {"win": 82.3648, "tie": 0.5436, "lose": 17.0916, "boards": 1712304},
        "AA|QQ": {"win": 81.9717, "tie": 0.5152, "lose": 17.5131, "boards": 1712304},
    }


class _TmpTable:
    """Context manager writing a sample table to a temp file."""

    def __enter__(self):
        self.dir = tempfile.mkdtemp()
        self.path = os.path.join(self.dir, "equity_table.json")
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(_sample_table(), f)
        return self.path

    def __exit__(self, *exc):
        import shutil
        shutil.rmtree(self.dir, ignore_errors=True)


class TestEquityTable(unittest.TestCase):
    """Tests for the EquityTable reader."""

    def test_loads_and_lookups(self):
        with _TmpTable() as path:
            t = EquityTable(path)
            self.assertEqual(t.size, 5)
            entry = t.lookup("AA", "AKo")
            self.assertIsNotNone(entry)
            self.assertAlmostEqual(entry["win"], 92.7967)
            self.assertTrue(t.has("AA", "AKo"))

    def test_missing_file_raises(self):
        with self.assertRaises(FileNotFoundError):
            EquityTable("/nonexistent/path/table.json")

    def test_missing_pairing_returns_none(self):
        with _TmpTable() as path:
            t = EquityTable(path)
            self.assertIsNone(t.lookup("AA", "22"))


class TestAggregateEquity(unittest.TestCase):
    """Tests for AggregateEquity (instant, exact aggregation)."""

    def test_aggregate_single_hand(self):
        """Aggregating a single hand returns its exact table equity."""
        with _TmpTable() as path:
            agg = AggregateEquity(EquityTable(path))
            r = agg.aggregate("AA", ["AKo"])
            self.assertAlmostEqual(r.win, 92.7967, places=3)
            self.assertAlmostEqual(r.tie, 1.3474, places=3)
            self.assertAlmostEqual(r.lose, 5.8559, places=3)

    def test_aggregate_weighted_by_available_combos(self):
        """AA vs [AKo, AKs] weights AKo=6, AKs=2 (hero AA uses 2 aces).

        AKo equity 92.7967 (weight 6) and AKs equity 87.2316 (weight 2):
        weighted win = (92.7967*6 + 87.2316*2) / 8 = 91.4054.
        """
        with _TmpTable() as path:
            agg = AggregateEquity(EquityTable(path))
            r = agg.aggregate("AA", ["AKo", "AKs"])
            hands = {h.hand: h for h in r.by_hand}
            self.assertEqual(hands["AKo"].combos, 6)
            self.assertEqual(hands["AKs"].combos, 2)
            self.assertAlmostEqual(r.win, 91.4054, places=3)

    def test_aggregate_reproducible(self):
        """Aggregation is bit-identical across calls (no variance)."""
        with _TmpTable() as path:
            agg = AggregateEquity(EquityTable(path))
            r1 = agg.aggregate("AA", ["AKo", "KK", "QQ"])
            r2 = agg.aggregate("AA", ["AKo", "KK", "QQ"])
            self.assertEqual(r1.win, r2.win)
            self.assertEqual(r1.tie, r2.tie)
            self.assertEqual(r1.lose, r2.lose)

    def test_empty_range_raises(self):
        with _TmpTable() as path:
            with self.assertRaises(ValueError):
                AggregateEquity(EquityTable(path)).aggregate("AA", [])

    def test_missing_entry_raises(self):
        """A pairing absent from the table makes aggregate() raise.

        Callers should detect missing entries via missing_entries() and fall
        back to Monte-Carlo rather than getting a silently-zero equity.
        """
        with _TmpTable() as path:
            agg = AggregateEquity(EquityTable(path))
            # 22 is absent from the sample table.
            self.assertEqual(agg.missing_entries("AA", ["AKo", "22"]), ["22"])
            with self.assertRaises(ValueError):
                agg.aggregate("AA", ["AKo", "22"])

    def test_missing_entries_empty_when_complete(self):
        """missing_entries is empty when all pairings are in the table."""
        with _TmpTable() as path:
            agg = AggregateEquity(EquityTable(path))
            self.assertEqual(agg.missing_entries("AA", ["AKo", "KK", "QQ"]), [])

    def test_aggregate_notation(self):
        with _TmpTable() as path:
            agg = AggregateEquity(EquityTable(path))
            r = agg.aggregate_notation("AA", "KK, QQ")
            self.assertGreater(r.win, 81.0)
            self.assertLess(r.win, 83.0)


if __name__ == "__main__":
    unittest.main()
