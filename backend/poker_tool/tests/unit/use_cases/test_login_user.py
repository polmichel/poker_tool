"""
Unit tests for the LoginUser use case (with in-memory fakes, no mocks).
"""
import unittest
from poker_tool.use_cases.login_user import LoginUser, InvalidCredentials
from poker_tool.use_cases.register_user import RegisterUser
from .fakes import FakeUsers, FakeAuth


class TestLoginUser(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.auth = FakeAuth()
        # Register a user first so we can log in.
        RegisterUser(self.users, self.auth).register("alice", "alice@test.com", "secret")
        self.use_case = LoginUser(self.users, self.auth)

    def test_login_returns_user_and_token(self):
        result = self.use_case.login("alice", "secret")

        self.assertEqual(result.user.username, "alice")
        self.assertEqual(result.token, "token_for_1")

    def test_login_wrong_password(self):
        with self.assertRaises(InvalidCredentials):
            self.use_case.login("alice", "wrong")

    def test_login_unknown_user(self):
        with self.assertRaises(InvalidCredentials):
            self.use_case.login("ghost", "secret")


if __name__ == '__main__':
    unittest.main()
