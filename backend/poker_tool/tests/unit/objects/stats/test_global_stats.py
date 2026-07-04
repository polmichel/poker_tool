"""
Unit tests for GlobalStats value object.
"""
import unittest
from poker_tool.objects.stats.global_stats import GlobalStats


class TestGlobalStats(unittest.TestCase):
    """Tests for GlobalStats class."""

    def test_global_stats_creation(self):
        """Test GlobalStats creation."""
        stats = GlobalStats(
            total_ranges=10,
            total_users=5,
            total_sessions=20,
            avg_score=75.5,
            most_common_action="raise",
        )
        
        self.assertEqual(stats.total_ranges, 10)
        self.assertEqual(stats.total_users, 5)
        self.assertEqual(stats.total_sessions, 20)
        self.assertEqual(stats.avg_score, 75.5)
        self.assertEqual(stats.most_common_action, "raise")

    def test_global_stats_defaults(self):
        """Test GlobalStats with default values."""
        stats = GlobalStats()
        
        self.assertEqual(stats.total_ranges, 0)
        self.assertEqual(stats.total_users, 0)
        self.assertEqual(stats.total_sessions, 0)
        self.assertEqual(stats.avg_score, 0.0)
        self.assertEqual(stats.most_common_action, "undefined")

    def test_global_stats_to_dict(self):
        """Test serialization to dictionary."""
        stats = GlobalStats(
            total_ranges=10,
            total_users=5,
            total_sessions=20,
            avg_score=75.5,
            most_common_action="raise",
        )
        
        stats_dict = stats.to_dict()
        
        self.assertEqual(stats_dict["total_ranges"], 10)
        self.assertEqual(stats_dict["total_users"], 5)
        self.assertEqual(stats_dict["total_sessions"], 20)
        self.assertEqual(stats_dict["avg_score"], 75.5)
        self.assertEqual(stats_dict["most_common_action"], "raise")

    def test_global_stats_from_dict(self):
        """Test creation from dictionary."""
        data = {
            "total_ranges": 10,
            "total_users": 5,
            "total_sessions": 20,
            "avg_score": 75.5,
            "most_common_action": "raise",
        }
        
        stats = GlobalStats.from_dict(data)
        
        self.assertEqual(stats.total_ranges, 10)
        self.assertEqual(stats.total_users, 5)
        self.assertEqual(stats.total_sessions, 20)
        self.assertEqual(stats.avg_score, 75.5)
        self.assertEqual(stats.most_common_action, "raise")

    def test_global_stats_from_dict_with_missing_values(self):
        """Test creation from dictionary with missing values."""
        data = {"total_ranges": 10}
        
        stats = GlobalStats.from_dict(data)
        
        self.assertEqual(stats.total_ranges, 10)
        self.assertEqual(stats.total_users, 0)
        self.assertEqual(stats.total_sessions, 0)
        self.assertEqual(stats.avg_score, 0.0)
        self.assertEqual(stats.most_common_action, "undefined")

    def test_global_stats_equality(self):
        """Test equality comparison."""
        stats1 = GlobalStats(
            total_ranges=10,
            total_users=5,
            total_sessions=20,
            avg_score=75.5,
            most_common_action="raise",
        )
        stats2 = GlobalStats(
            total_ranges=10,
            total_users=5,
            total_sessions=20,
            avg_score=75.5,
            most_common_action="raise",
        )
        stats3 = GlobalStats(
            total_ranges=15,
            total_users=5,
            total_sessions=20,
            avg_score=75.5,
            most_common_action="raise",
        )
        
        self.assertEqual(stats1, stats2)
        self.assertNotEqual(stats1, stats3)
        self.assertNotEqual(stats1, "not stats")

    def test_global_stats_hash(self):
        """Test hash for use in sets/dicts."""
        stats1 = GlobalStats(
            total_ranges=10,
            total_users=5,
            total_sessions=20,
            avg_score=75.5,
            most_common_action="raise",
        )
        stats2 = GlobalStats(
            total_ranges=10,
            total_users=5,
            total_sessions=20,
            avg_score=75.5,
            most_common_action="raise",
        )
        
        # Should be able to use in sets
        stats_set = {stats1, stats2}
        self.assertEqual(len(stats_set), 1)


if __name__ == '__main__':
    unittest.main()
