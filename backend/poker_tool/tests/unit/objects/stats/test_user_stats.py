"""
Unit tests for UserStats value object.
"""
import unittest
from poker_tool.objects.stats.user_stats import UserStats


class TestUserStats(unittest.TestCase):
    """Tests for UserStats class."""

    def test_user_stats_creation(self):
        """Test UserStats creation."""
        stats = UserStats(
            user_id=1,
            total_sessions=10,
            avg_score=75.5,
            total_time_spent=3600,
            best_score=95.0,
            most_played_range="BTN Range",
        )
        
        self.assertEqual(stats.user_id, 1)
        self.assertEqual(stats.total_sessions, 10)
        self.assertEqual(stats.avg_score, 75.5)
        self.assertEqual(stats.total_time_spent, 3600)
        self.assertEqual(stats.best_score, 95.0)
        self.assertEqual(stats.most_played_range, "BTN Range")

    def test_user_stats_creation_minimal(self):
        """Test UserStats creation with minimal parameters."""
        stats = UserStats(user_id=1)
        
        self.assertEqual(stats.user_id, 1)
        self.assertEqual(stats.total_sessions, 0)
        self.assertEqual(stats.avg_score, 0.0)
        self.assertEqual(stats.total_time_spent, 0)
        self.assertEqual(stats.best_score, 0.0)
        self.assertEqual(stats.most_played_range, "")

    def test_user_stats_to_dict(self):
        """Test serialization to dictionary."""
        stats = UserStats(
            user_id=1,
            total_sessions=10,
            avg_score=75.5,
            total_time_spent=3600,
            best_score=95.0,
            most_played_range="BTN Range",
        )
        
        stats_dict = stats.to_dict()
        
        self.assertEqual(stats_dict["user_id"], 1)
        self.assertEqual(stats_dict["total_sessions"], 10)
        self.assertEqual(stats_dict["avg_score"], 75.5)
        self.assertEqual(stats_dict["total_time_spent"], 3600)
        self.assertEqual(stats_dict["best_score"], 95.0)
        self.assertEqual(stats_dict["most_played_range"], "BTN Range")

    def test_user_stats_from_dict(self):
        """Test creation from dictionary."""
        data = {
            "user_id": 1,
            "total_sessions": 10,
            "avg_score": 75.5,
            "total_time_spent": 3600,
            "best_score": 95.0,
            "most_played_range": "BTN Range",
        }
        
        stats = UserStats.from_dict(data)
        
        self.assertEqual(stats.user_id, 1)
        self.assertEqual(stats.total_sessions, 10)
        self.assertEqual(stats.avg_score, 75.5)
        self.assertEqual(stats.total_time_spent, 3600)
        self.assertEqual(stats.best_score, 95.0)
        self.assertEqual(stats.most_played_range, "BTN Range")

    def test_user_stats_from_dict_with_missing_values(self):
        """Test creation from dictionary with missing values."""
        data = {"user_id": 1, "total_sessions": 10}
        
        stats = UserStats.from_dict(data)
        
        self.assertEqual(stats.user_id, 1)
        self.assertEqual(stats.total_sessions, 10)
        self.assertEqual(stats.avg_score, 0.0)
        self.assertEqual(stats.total_time_spent, 0)
        self.assertEqual(stats.best_score, 0.0)
        self.assertEqual(stats.most_played_range, "")

    def test_user_stats_equality(self):
        """Test equality comparison."""
        stats1 = UserStats(
            user_id=1,
            total_sessions=10,
            avg_score=75.5,
            total_time_spent=3600,
            best_score=95.0,
            most_played_range="BTN Range",
        )
        stats2 = UserStats(
            user_id=1,
            total_sessions=10,
            avg_score=75.5,
            total_time_spent=3600,
            best_score=95.0,
            most_played_range="BTN Range",
        )
        stats3 = UserStats(
            user_id=2,
            total_sessions=10,
            avg_score=75.5,
            total_time_spent=3600,
            best_score=95.0,
            most_played_range="BTN Range",
        )
        
        self.assertEqual(stats1, stats2)
        self.assertNotEqual(stats1, stats3)
        self.assertNotEqual(stats1, "not stats")

    def test_user_stats_hash(self):
        """Test hash for use in sets/dicts."""
        stats1 = UserStats(
            user_id=1,
            total_sessions=10,
            avg_score=75.5,
            total_time_spent=3600,
            best_score=95.0,
            most_played_range="BTN Range",
        )
        stats2 = UserStats(
            user_id=1,
            total_sessions=10,
            avg_score=75.5,
            total_time_spent=3600,
            best_score=95.0,
            most_played_range="BTN Range",
        )
        
        # Should be able to use in sets
        stats_set = {stats1, stats2}
        self.assertEqual(len(stats_set), 1)


if __name__ == '__main__':
    unittest.main()
