"""
Unit tests for the GlobalStats and UserStats use cases (in-memory fakes).
"""
import unittest
from unittest.mock import patch
from poker_tool.use_cases.global_stats import GlobalStats
from poker_tool.use_cases.user_stats import UserStats, UserNotFound
from poker_tool.use_cases.register_user import RegisterUser
from poker_tool.use_cases.create_range import CreateRange
from poker_tool.objects.range_type import RangeType
from poker_tool.objects.position import Position
from poker_tool.objects.action import Action, ActionType
from poker_tool.objects.training.session import TrainingSession
from .fakes import FakeUsers, FakeRanges, FakeSessions, FakeAuth


class TestGlobalStats(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        self.use_case = GlobalStats(self.ranges, self.users, self.sessions)

    def test_empty_stats(self):
        stats = self.use_case.compute()
        self.assertEqual(stats["total_ranges"], 0)
        self.assertEqual(stats["total_users"], 0)
        self.assertEqual(stats["total_sessions"], 0)
        self.assertEqual(stats["avg_score"], 0.0)
        self.assertEqual(stats["most_common_action"], "UNDEFINED")

    def test_with_data(self):
        RegisterUser(self.users, self.auth).register("alice", "a@t.com", "p")
        CreateRange(self.ranges, self.auth).create({
            "name": "R1", "range_type": "preflop", "position": "BTN",
            "hands": {"AA": "raise", "KK": "call"},
            "user_id": 1,
        })

        stats = self.use_case.compute()
        self.assertEqual(stats["total_ranges"], 1)
        self.assertEqual(stats["total_users"], 1)
        self.assertEqual(stats["total_hands"], 2)
        self.assertEqual(stats["most_common_action"], "RAISE")


class TestUserStats(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        self.use_case = UserStats(self.users, self.ranges, self.sessions)

    def test_unknown_user_raises(self):
        with self.assertRaises(UserNotFound):
            self.use_case.compute(999)

    def test_user_with_no_sessions(self):
        RegisterUser(self.users, self.auth).register("alice", "a@t.com", "p")
        stats = self.use_case.compute(1)
        self.assertEqual(stats["total_sessions"], 0)
        self.assertEqual(stats["avg_score"], 0.0)
        self.assertEqual(stats["most_played_range"], "")


if __name__ == '__main__':
    unittest.main()
