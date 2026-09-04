"""
Unit tests for Flask JSON error handling.

Verifies that HTTP exceptions (BadRequest, NotFound) return JSON responses
with an 'error' field, not HTML pages. This is what the frontend relies on
to display meaningful error messages (e.g. "Username already exists").

No mocks: the Flask app is composed from real use cases wired to in-memory
fakes of the ports, so the HTTP error path is exercised against genuine
behavior (e.g. RegisterUser raising UserAlreadyExists, an empty FakeRanges
returning None for a missing id).
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from flask import Flask

from poker_tool.infrastructure.web.flask_app import FlaskApp
from poker_tool.use_cases.answer_question import AnswerQuestion
from poker_tool.use_cases.create_range import CreateRange
from poker_tool.use_cases.current_user import CurrentUser
from poker_tool.use_cases.delete_range import DeleteRange
from poker_tool.use_cases.end_training_session import EndTrainingSession
from poker_tool.use_cases.get_all_ranges import GetAllRanges
from poker_tool.use_cases.get_range_by_id import GetRangeById
from poker_tool.use_cases.get_ranges_by_user import GetRangesByUser
from poker_tool.use_cases.global_stats import GlobalStats
from poker_tool.use_cases.login_user import LoginUser
from poker_tool.use_cases.register_user import RegisterUser
from poker_tool.use_cases.resolve_user import ResolveUser
from poker_tool.use_cases.start_training_session import StartTrainingSession
from poker_tool.use_cases.update_range import UpdateRange
from poker_tool.use_cases.user_stats import UserStats

from ...unit.use_cases.fakes import (
    FakeAuth,
    FakeEquityCalculator,
    FakeRanges,
    FakeSessions,
    FakeUsers,
)


class TestJsonErrorHandling(unittest.TestCase):
    """Tests that HTTP errors return JSON, not HTML."""

    def setUp(self):
        """Compose a real Flask app from in-memory fakes (no mocks)."""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True

        # In-memory ports.
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        self.resolve_user = ResolveUser(self.users, self.auth)

        # Real use cases wired to the in-memory ports.
        self.register_user = RegisterUser(self.users, self.auth)
        self.login_user = LoginUser(self.users, self.auth)
        self.current_user = CurrentUser(self.users, self.auth)
        self.create_range = CreateRange(self.ranges, self.resolve_user)
        self.update_range = UpdateRange(self.ranges)
        self.get_all_ranges = GetAllRanges(self.ranges)
        self.get_range_by_id = GetRangeById(self.ranges)
        self.get_ranges_by_user = GetRangesByUser(self.ranges)
        self.delete_range = DeleteRange(self.ranges)
        self.start_training = StartTrainingSession(
            self.ranges, self.sessions, self.resolve_user,
        )
        self.answer_question = AnswerQuestion(self.sessions)
        self.end_training = EndTrainingSession(self.sessions)
        self.global_stats = GlobalStats(self.ranges, self.users, self.sessions)
        self.user_stats = UserStats(self.users, self.ranges, self.sessions)

        self.flask_app = FlaskApp(
            flask_app=self.app,
            users=self.users,
            ranges=self.ranges,
            sessions=self.sessions,
            auth=self.auth,
            register_user=self.register_user,
            login_user=self.login_user,
            current_user=self.current_user,
            create_range=self.create_range,
            update_range=self.update_range,
            get_all_ranges=self.get_all_ranges,
            get_range_by_id=self.get_range_by_id,
            get_ranges_by_user=self.get_ranges_by_user,
            delete_range=self.delete_range,
            start_training=self.start_training,
            answer_question=self.answer_question,
            end_training=self.end_training,
            global_stats=self.global_stats,
            user_stats=self.user_stats,
            table_equity=FakeEquityCalculator(),
            monte_carlo_equity=FakeEquityCalculator(),
        )

    def test_bad_request_returns_json(self):
        """BadRequest exceptions should return JSON with an 'error' field."""
        with self.app.test_client() as client:
            # POST /api/ranges without a name triggers BadRequest("Missing name")
            response = client.post('/api/ranges', json={})
            self.assertEqual(response.status_code, 400)
            data = response.get_json()
            self.assertIsNotNone(data)
            self.assertIn('error', data)
            self.assertEqual(data['error'], 'Missing name')

    def test_not_found_returns_json(self):
        """NotFound exceptions should return JSON with an 'error' field."""
        # FakeRanges is empty, so range_by_id returns None -> 404.
        with self.app.test_client() as client:
            response = client.get('/api/ranges/99999')
            self.assertEqual(response.status_code, 404)
            data = response.get_json()
            self.assertIsNotNone(data)
            self.assertIn('error', data)

    def test_register_duplicate_returns_json_error(self):
        """Registration with a duplicate username returns JSON, not HTML."""
        # Seed the in-memory store with an existing user so RegisterUser raises
        # UserAlreadyExists on the second registration.
        self.users.add(self.auth.create_user(
            username='test', email='taken@test.com', password='pass123',
        ))
        with self.app.test_client() as client:
            response = client.post('/api/auth/register', json={
                'username': 'test', 'email': 'test@test.com', 'password': 'pass123',
            })
            self.assertEqual(response.status_code, 400)
            data = response.get_json()
            self.assertIsNotNone(data)
            self.assertEqual(data['error'], 'Username already exists')


if __name__ == '__main__':
    unittest.main()
