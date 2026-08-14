"""
Unit tests for the CurrentUser use case (with in-memory fakes, no mocks).
"""
import unittest
from poker_tool.use_cases.current_user import CurrentUser
from poker_tool.use_cases.register_user import RegisterUser
from poker_tool.objects.user import User
from .fakes import FakeUsers, FakeAuth


class TestCurrentUser(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.auth = FakeAuth()
        RegisterUser(self.users, self.auth).register("alice", "a@t.com", "p")
        self.use_case = CurrentUser(self.users, self.auth)

    def test_returns_authenticated_user(self):
        alice = self.users.user_by_username("alice")
        self.auth.set_current_user(alice)

        result = self.use_case.user()
        self.assertEqual(result.username, "alice")

    def test_falls_back_to_first_user_when_anonymous(self):
        self.auth.set_current_user(None)
        result = self.use_case.user()
        self.assertEqual(result.username, "alice")

    def test_returns_none_when_no_users(self):
        empty_users = FakeUsers()
        self.auth.set_current_user(None)
        use_case = CurrentUser(empty_users, self.auth)
        self.assertIsNone(use_case.user())


if __name__ == '__main__':
    unittest.main()
