"""
Unit tests for the RegisterUser use case (with in-memory fakes, no mocks).
"""
import unittest

from poker_tool.use_cases.register_user import RegisterUser, UserAlreadyExists

from .fakes import FakeAuth, FakeUsers


class TestRegisterUser(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.auth = FakeAuth()
        self.use_case = RegisterUser(self.users, self.auth)

    def test_register_creates_user_and_returns_token(self):
        result = self.use_case.register("alice", "alice@test.com", "secret")

        self.assertEqual(result.user.username, "alice")
        self.assertEqual(result.user.email, "alice@test.com")
        self.assertEqual(result.token, "token_for_1")
        self.assertEqual(result.user.id, 1)

    def test_register_persists_user(self):
        self.use_case.register("alice", "alice@test.com", "secret")
        found = self.users.user_by_username("alice")
        self.assertIsNotNone(found)
        self.assertEqual(found.email, "alice@test.com")

    def test_register_rejects_duplicate_username(self):
        self.use_case.register("alice", "alice@test.com", "secret")
        with self.assertRaises(UserAlreadyExists):
            self.use_case.register("alice", "other@test.com", "secret")

    def test_register_rejects_duplicate_email(self):
        self.use_case.register("alice", "alice@test.com", "secret")
        with self.assertRaises(UserAlreadyExists):
            self.use_case.register("bob", "alice@test.com", "secret")

    def test_register_increments_ids(self):
        r1 = self.use_case.register("alice", "a@t.com", "p")
        r2 = self.use_case.register("bob", "b@t.com", "p")
        self.assertEqual(r1.user.id, 1)
        self.assertEqual(r2.user.id, 2)


if __name__ == '__main__':
    unittest.main()
