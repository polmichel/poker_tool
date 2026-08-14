"""
Unit tests for the training use cases (in-memory fakes, no mocks).

These exercise StartTrainingSession, AnswerQuestion and EndTrainingSession
with real domain objects and in-memory ports.
"""
import unittest
from unittest.mock import patch

from poker_tool.use_cases.answer_question import AnswerQuestion, SessionNotFound
from poker_tool.use_cases.create_range import CreateRange
from poker_tool.use_cases.end_training_session import EndTrainingSession
from poker_tool.use_cases.register_user import RegisterUser
from poker_tool.use_cases.start_training_session import (
    RangeHasNoHands,
    RangeNotFound,
    StartTrainingSession,
)

from .fakes import FakeAuth, FakeRanges, FakeSessions, FakeUsers


class TestStartTrainingSession(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        RegisterUser(self.users, self.auth).register("alice", "a@t.com", "p")
        CreateRange(self.ranges, self.auth).create({
            "name": "R1", "range_type": "preflop", "position": "BTN",
            "hands": {"AA": "raise", "KK": "call"}, "user_id": 1,
        })
        self.use_case = StartTrainingSession(self.ranges, self.users, self.sessions, self.auth)

    def test_start_creates_session(self):
        result = self.use_case.start("fill", range_id=1, user_id=1)
        self.assertEqual(result.session.user.username, "alice")
        self.assertEqual(result.session.mode, "fill")
        self.assertIsNotNone(result.session.id)
        self.assertIsNotNone(result.session.current_question)

    def test_start_unknown_range_raises(self):
        with self.assertRaises(RangeNotFound):
            self.use_case.start("fill", range_id=999, user_id=1)

    def test_start_range_with_no_hands_raises(self):
        CreateRange(self.ranges, self.auth).create({
            "name": "Empty", "range_type": "preflop", "position": "BTN",
            "hands": {}, "user_id": 1,
        })
        with self.assertRaises(RangeHasNoHands):
            self.use_case.start("fill", range_id=2, user_id=1)

    def test_start_falls_back_to_first_user(self):
        self.auth.set_current_user(None)
        result = self.use_case.start("fill", range_id=1)
        self.assertEqual(result.session.user.username, "alice")

    def test_start_uses_authenticated_user(self):
        alice = self.users.user_by_username("alice")
        self.auth.set_current_user(alice)
        result = self.use_case.start("fill", range_id=1)
        self.assertEqual(result.session.user.id, 1)


class TestAnswerQuestion(unittest.TestCase):

    def _start_session(self, sessions, ranges, users, auth):
        RegisterUser(users, auth).register("alice", "a@t.com", "p")
        CreateRange(ranges, auth).create({
            "name": "R1", "range_type": "preflop", "position": "BTN",
            "hands": {"AA": "raise", "KK": "call"}, "user_id": 1,
        })
        starter = StartTrainingSession(ranges, users, sessions, auth)
        with patch('poker_tool.objects.training.session.random.sample') as m:
            m.return_value = ["AA", "KK"]
            return starter.start("fill", range_id=1, user_id=1)

    def setUp(self):
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        self.started = self._start_session(
            self.sessions, self.ranges, self.users, self.auth,
        )
        self.use_case = AnswerQuestion(self.sessions)

    def test_answer_returns_response_payload(self):
        result = self.use_case.answer(self.started.session.id, "raise")
        self.assertIn("is_correct", result.response)
        self.assertIn("progress", result.response)
        self.assertIn("correct_answer", result.response)

    def test_answer_unknown_session_raises(self):
        with self.assertRaises(SessionNotFound):
            self.use_case.answer(999, "raise")

    def test_answer_persists_new_session(self):
        original = self.sessions.session_by_id(self.started.session.id)
        self.use_case.answer(self.started.session.id, "raise")
        updated = self.sessions.session_by_id(self.started.session.id)
        self.assertGreaterEqual(updated.current_index, original.current_index)


class TestEndTrainingSession(unittest.TestCase):

    def setUp(self):
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        RegisterUser(self.users, self.auth).register("alice", "a@t.com", "p")
        CreateRange(self.ranges, self.auth).create({
            "name": "R1", "range_type": "preflop", "position": "BTN",
            "hands": {"AA": "raise", "KK": "call"}, "user_id": 1,
        })
        starter = StartTrainingSession(
            self.ranges, self.users, self.sessions, self.auth,
        )
        with patch('poker_tool.objects.training.session.random.sample') as m:
            m.return_value = ["AA", "KK"]
            self.started = starter.start("fill", range_id=1, user_id=1)
        self.use_case = EndTrainingSession(self.sessions)

    def test_end_marks_session_ended(self):
        result = self.use_case.end(self.started.session.id)
        self.assertIsNotNone(result.session._ended_at)

    def test_end_unknown_session_raises(self):
        from poker_tool.use_cases.end_training_session import SessionNotFound
        with self.assertRaises(SessionNotFound):
            self.use_case.end(999)


if __name__ == '__main__':
    unittest.main()
