"""
Unit tests for FlaskApp infrastructure.

The FlaskApp now delegates business logic to use cases. These tests inject
mocked use cases to verify the HTTP controllers translate requests/responses
correctly.
"""
import unittest
from unittest.mock import MagicMock

from flask import Flask

from poker_tool.infrastructure.web.flask_app import FlaskApp
from poker_tool.interfaces.auth import Auth
from poker_tool.interfaces.ranges import Ranges
from poker_tool.interfaces.training_sessions import TrainingSessions
from poker_tool.interfaces.users import Users


class TestFlaskApp(unittest.TestCase):
    """Tests for FlaskApp class."""

    def setUp(self):
        """Set up test fixtures with mocked ports and use cases."""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.users = MagicMock(spec=Users)
        self.ranges = MagicMock(spec=Ranges)
        self.sessions = MagicMock(spec=TrainingSessions)
        self.auth = MagicMock(spec=Auth)
        self.register_user = MagicMock()
        self.login_user = MagicMock()
        self.current_user = MagicMock()
        self.create_range = MagicMock()
        self.update_range = MagicMock()
        self.start_training = MagicMock()
        self.answer_question = MagicMock()
        self.end_training = MagicMock()
        self.global_stats = MagicMock()
        self.user_stats = MagicMock()

    def _make_app(self):
        return FlaskApp(
            self.app, self.users, self.ranges, self.sessions, self.auth,
            self.register_user, self.login_user, self.current_user,
            self.create_range, self.update_range,
            self.start_training, self.answer_question, self.end_training,
            self.global_stats, self.user_stats,
        )

    def test_flask_app_creation(self):
        """Test FlaskApp creation."""
        flask_app = self._make_app()
        self.assertEqual(flask_app.app, self.app)
        self.assertEqual(flask_app.users, self.users)
        self.assertEqual(flask_app.ranges, self.ranges)
        self.assertEqual(flask_app.auth, self.auth)

    def test_flask_app_registers_routes(self):
        """Test that FlaskApp registers routes."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.get('/api/health')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['status'], 'healthy')
            self.assertEqual(data['version'], '1.0.0')

    def test_get_ranges_route(self):
        """Test GET /api/ranges route."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        mock_range = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            range_id=1,
        )
        self.ranges.all.return_value = [mock_range]
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/ranges')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertIsInstance(data, list)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]['name'], 'Test Range')

    def test_get_range_route(self):
        """Test GET /api/ranges/<id> route."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        mock_range = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            range_id=1,
        )
        self.ranges.range_by_id.return_value = mock_range
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/ranges/1')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['name'], 'Test Range')

    def test_get_range_route_not_found(self):
        """Test GET /api/ranges/<id> route with non-existent range."""
        self.ranges.range_by_id.return_value = None
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/ranges/999')
            self.assertEqual(response.status_code, 404)

    def test_create_range_route(self):
        """Test POST /api/ranges route delegates to the CreateRange use case."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        mock_range = Range(
            name="New Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            user_id=1,
        )
        self.create_range.create.return_value = mock_range
        self._make_app()

        with self.app.test_client() as client:
            response = client.post('/api/ranges', json={'name': 'New Range'})
            self.assertEqual(response.status_code, 201)
            data = response.get_json()
            self.assertEqual(data['name'], 'New Range')
        self.create_range.create.assert_called_once_with({'name': 'New Range'})

    def test_create_range_route_missing_name(self):
        """Test POST /api/ranges route with missing name."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.post('/api/ranges', json={})
            self.assertEqual(response.status_code, 400)

    def test_get_global_stats_route(self):
        """Test GET /api/stats/global delegates to the GlobalStats use case."""
        self.global_stats.compute.return_value = {
            'total_ranges': 2,
            'total_users': 1,
            'total_sessions': 3,
            'total_hands': 5,
            'avg_score': 4.5,
            'most_common_action': 'RAISE',
        }
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/stats/global')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['total_ranges'], 2)
            self.assertEqual(data['total_sessions'], 3)
            self.assertEqual(data['avg_score'], 4.5)
            self.assertEqual(data['most_common_action'], 'RAISE')
        self.global_stats.compute.assert_called_once_with()

    def test_get_global_stats_route_error(self):
        """Test GET /api/stats/global returns a JSON 500 when the use case fails.

        This is the backend side of the "Erreur lors du chargement des
        statistiques globales" message shown on the home page: a use-case
        failure surfaces as a structured JSON 500 (not Flask's default HTML
        error page) so the frontend receives a clean error body.
        """
        self.global_stats.compute.side_effect = RuntimeError('db down')
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/stats/global')
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.get_json()['error'],
                             'Erreur lors du chargement des statistiques globales')
        self.global_stats.compute.assert_called_once_with()

    def test_get_user_stats_route(self):
        """Test GET /api/stats/user/<id> delegates to the UserStats use case."""
        self.user_stats.compute.return_value = {
            'user_id': 1,
            'total_sessions': 2,
            'avg_score': 3.0,
            'total_time_spent': 120,
            'best_score': 5.0,
            'most_played_range': 'R1',
        }
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/stats/user/1')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['user_id'], 1)
            self.assertEqual(data['total_sessions'], 2)
        self.user_stats.compute.assert_called_once_with(1)

    def test_get_user_stats_route_not_found(self):
        """Test GET /api/stats/user/<id> returns 404 for an unknown user."""
        from poker_tool.use_cases.user_stats import UserNotFound

        self.user_stats.compute.side_effect = UserNotFound('User 999 not found')
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/stats/user/999')
            self.assertEqual(response.status_code, 404)
        self.user_stats.compute.assert_called_once_with(999)

    def test_get_user_stats_route_error(self):
        """Test GET /api/stats/user/<id> returns a JSON 500 on unexpected failure."""
        self.user_stats.compute.side_effect = RuntimeError('db down')
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/stats/user/1')
            self.assertEqual(response.status_code, 500)
            self.assertIn('error', response.get_json())
        self.user_stats.compute.assert_called_once_with(1)


if __name__ == '__main__':
    unittest.main()
