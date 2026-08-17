"""
Unit tests for Flask JSON error handling.

Verifies that HTTP exceptions (BadRequest, NotFound) return JSON responses
with an 'error' field, not HTML pages. This is what the frontend relies on
to display meaningful error messages (e.g. "Username already exists").
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock

from flask import Flask

from poker_tool.infrastructure.web.flask_app import FlaskApp
from poker_tool.use_cases.register_user import UserAlreadyExists


class TestJsonErrorHandling(unittest.TestCase):
    """Tests that HTTP errors return JSON, not HTML."""

    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.users = MagicMock()
        self.ranges = MagicMock()
        self.sessions = MagicMock()
        self.auth = MagicMock()
        self.register_user_mock = MagicMock()
        kwargs = dict(
            flask_app=self.app,
            users=self.users,
            ranges=self.ranges,
            sessions=self.sessions,
            auth=self.auth,
            register_user=self.register_user_mock,
            login_user=MagicMock(),
            current_user=MagicMock(),
            create_range=MagicMock(),
            update_range=MagicMock(),
            start_training=MagicMock(),
            answer_question=MagicMock(),
            end_training=MagicMock(),
            global_stats=MagicMock(),
            user_stats=MagicMock(),
            simulate_equity=MagicMock(),
        )
        self.flask_app = FlaskApp(**kwargs)

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
        self.ranges.range_by_id.return_value = None
        with self.app.test_client() as client:
            response = client.get('/api/ranges/99999')
            self.assertEqual(response.status_code, 404)
            data = response.get_json()
            self.assertIsNotNone(data)
            self.assertIn('error', data)

    def test_register_duplicate_returns_json_error(self):
        """Registration with a duplicate username returns JSON, not HTML."""
        self.register_user_mock.register.side_effect = UserAlreadyExists(
            "Username already exists"
        )
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
