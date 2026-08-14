"""
Unit tests for the CreateRange and UpdateRange use cases (in-memory fakes).
"""
import unittest
from poker_tool.use_cases.create_range import CreateRange
from poker_tool.use_cases.update_range import UpdateRange, RangeNotFound
from poker_tool.use_cases.register_user import RegisterUser
from .fakes import FakeUsers, FakeRanges, FakeAuth


class TestCreateRange(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.auth = FakeAuth()
        RegisterUser(self.users, self.auth).register("alice", "a@t.com", "p")
        self.use_case = CreateRange(self.ranges, self.auth)

    def test_create_with_explicit_user(self):
        result = self.use_case.create({
            "name": "R1", "range_type": "preflop", "position": "BTN",
            "hands": {"AA": "raise"}, "user_id": 1,
        })
        self.assertEqual(result.name, "R1")
        self.assertEqual(result.user_id, 1)
        self.assertIsNotNone(result.id)

    def test_create_resolves_user_from_auth(self):
        alice = self.users.user_by_username("alice")
        self.auth.set_current_user(alice)
        result = self.use_case.create({
            "name": "R2", "range_type": "preflop", "position": "BTN",
            "hands": {"KK": "call"},
        })
        self.assertEqual(result.user_id, 1)

    def test_create_without_user_stores_none(self):
        self.auth.set_current_user(None)
        result = self.use_case.create({
            "name": "R3", "range_type": "preflop", "position": "BTN",
            "hands": {"QQ": "call"},
        })
        self.assertIsNone(result.user_id)


class TestUpdateRange(unittest.TestCase):

    def setUp(self):
        self.ranges = FakeRanges()
        self.auth = FakeAuth()
        self.created = CreateRange(self.ranges, self.auth).create({
            "name": "Original", "range_type": "preflop", "position": "BTN",
            "hands": {"AA": "raise"}, "user_id": 1,
        })
        self.use_case = UpdateRange(self.ranges)

    def test_update_changes_name(self):
        result = self.use_case.update(self.created.id, {"name": "Updated"})
        self.assertEqual(result.name, "Updated")

    def test_update_unknown_range_raises(self):
        with self.assertRaises(RangeNotFound):
            self.use_case.update(999, {"name": "X"})

    def test_update_preserves_unchanged_fields(self):
        result = self.use_case.update(self.created.id, {"name": "NewName"})
        self.assertEqual(result.position.name, "BTN")


if __name__ == '__main__':
    unittest.main()
