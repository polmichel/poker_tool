"""
Unit tests for FlaskApp infrastructure.

The FlaskApp delegates business logic to use cases. These tests inject real
use cases wired to in-memory fakes of the ports (no mocks), so the HTTP
controllers are exercised against genuine behavior. For scenarios that need
a specific use-case result or a forced failure, small explicit fake use cases
are injected instead \u2014 still real components passed through the constructor,
never MagicMock.
"""
import unittest

from flask import Flask

from poker_tool.infrastructure.web.flask_app import FlaskApp
from poker_tool.use_cases.answer_question import AnswerQuestion
from poker_tool.use_cases.create_range import CreateRange
from poker_tool.use_cases.current_user import CurrentUser
from poker_tool.use_cases.end_training_session import EndTrainingSession
from poker_tool.use_cases.global_stats import GlobalStats
from poker_tool.use_cases.login_user import LoginUser
from poker_tool.use_cases.register_user import RegisterUser
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


class _StubGlobalStats(GlobalStats):
    """Fake GlobalStats use case returning a fixed result or raising.

    A real component injected through the FlaskApp constructor; used to test
    the stats controller's success and error-to-JSON paths without standing
    up the full ranges/users/sessions data.
    """

    def __init__(self, result: dict | None = None, error: Exception | None = None):
        # Do not call super().__init__ \u2014 we override compute entirely.
        self._result = result
        self._error = error

    def compute(self) -> dict:
        if self._error is not None:
            raise self._error
        return self._result


class _StubUserStats(UserStats):
    """Fake UserStats use case returning a fixed result or raising."""

    def __init__(self, result: dict | None = None, error: Exception | None = None):
        self._result = result
        self._error = error

    def compute(self, user_id: int) -> dict:
        if self._error is not None:
            raise self._error
        return self._result


class TestFlaskApp(unittest.TestCase):
    """Tests for FlaskApp class."""

    def setUp(self):
        """Set up test fixtures with in-memory ports and real use cases."""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        self.register_user = RegisterUser(self.users, self.auth)
        self.login_user = LoginUser(self.users, self.auth)
        self.current_user = CurrentUser(self.users, self.auth)
        self.create_range = CreateRange(self.ranges, self.auth)
        self.update_range = UpdateRange(self.ranges)
        self.start_training = StartTrainingSession(
            self.ranges, self.users, self.sessions, self.auth,
        )
        self.answer_question = AnswerQuestion(self.sessions)
        self.end_training = EndTrainingSession(self.sessions)
        self.global_stats = GlobalStats(self.ranges, self.users, self.sessions)
        self.user_stats = UserStats(self.users, self.ranges, self.sessions)

    def _make_app(
        self,
        global_stats=None,
        user_stats=None,
        equity_calculator=None,
    ):
        return FlaskApp(
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
            start_training=self.start_training,
            answer_question=self.answer_question,
            end_training=self.end_training,
            global_stats=global_stats or self.global_stats,
            user_stats=user_stats or self.user_stats,
            equity_calculator=equity_calculator or FakeEquityCalculator(),
        )

    def test_flask_app_creation(self):
        """Test FlaskApp creation exposes the injected app and ports."""
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
        """Test GET /api/ranges route lists ranges stored in the fake."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        self.ranges.add(Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            range_id=1,
        ))
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/ranges')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertIsInstance(data, list)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]['name'], 'Test Range')

    def test_get_range_route(self):
        """Test GET /api/ranges/<id> route returns a stored range."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        stored = self.ranges.add(Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
        ))
        self._make_app()

        with self.app.test_client() as client:
            response = client.get(f'/api/ranges/{stored.id}')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['name'], 'Test Range')

    def test_get_range_route_not_found(self):
        """Test GET /api/ranges/<id> route with non-existent range (404)."""
        # FakeRanges is empty, so range_by_id returns None -> 404.
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/ranges/999')
            self.assertEqual(response.status_code, 404)

    def test_create_range_route(self):
        """Test POST /api/ranges route delegates to the CreateRange use case."""
        self._make_app()

        with self.app.test_client() as client:
            response = client.post('/api/ranges', json={'name': 'New Range'})
            self.assertEqual(response.status_code, 201)
            data = response.get_json()
            self.assertEqual(data['name'], 'New Range')
        # The range was actually stored in the fake.
        self.assertEqual(len(self.ranges.all()), 1)
        self.assertEqual(self.ranges.all()[0].name, 'New Range')

    def test_create_range_route_missing_name(self):
        """Test POST /api/ranges route with missing name."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.post('/api/ranges', json={})
            self.assertEqual(response.status_code, 400)

    def test_get_global_stats_route(self):
        """Test GET /api/stats/global delegates to the GlobalStats use case."""
        stub = _StubGlobalStats(result={
            'total_ranges': 2,
            'total_users': 1,
            'total_sessions': 3,
            'total_hands': 5,
            'avg_score': 4.5,
            'most_common_action': 'RAISE',
        })
        self._make_app(global_stats=stub)

        with self.app.test_client() as client:
            response = client.get('/api/stats/global')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['total_ranges'], 2)
            self.assertEqual(data['total_sessions'], 3)
            self.assertEqual(data['avg_score'], 4.5)
            self.assertEqual(data['most_common_action'], 'RAISE')

    def test_get_global_stats_route_error(self):
        """Test GET /api/stats/global returns a JSON 500 when the use case fails.

        This is the backend side of the "Erreur lors du chargement des
        statistiques globales" message shown on the home page: a use-case
        failure surfaces as a structured JSON 500 (not Flask's default HTML
        error page) so the frontend receives a clean error body.
        """
        stub = _StubGlobalStats(error=RuntimeError('db down'))
        self._make_app(global_stats=stub)

        with self.app.test_client() as client:
            response = client.get('/api/stats/global')
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.get_json()['error'],
                             'Erreur lors du chargement des statistiques globales')

    def test_get_user_stats_route(self):
        """Test GET /api/stats/user/<id> delegates to the UserStats use case."""
        stub = _StubUserStats(result={
            'user_id': 1,
            'total_sessions': 2,
            'avg_score': 3.0,
            'total_time_spent': 120,
            'best_score': 5.0,
            'most_played_range': 'R1',
        })
        self._make_app(user_stats=stub)

        with self.app.test_client() as client:
            response = client.get('/api/stats/user/1')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['user_id'], 1)
            self.assertEqual(data['total_sessions'], 2)

    def test_get_user_stats_route_not_found(self):
        """Test GET /api/stats/user/<id> returns 404 for an unknown user.

        The real UserStats raises UserNotFound when the user is absent from
        the (empty) FakeUsers store, which the controller maps to 404.
        """
        self._make_app()

        with self.app.test_client() as client:
            response = client.get('/api/stats/user/999')
            self.assertEqual(response.status_code, 404)

    def test_get_user_stats_route_error(self):
        """Test GET /api/stats/user/<id> returns a JSON 500 on unexpected failure."""
        stub = _StubUserStats(error=RuntimeError('db down'))
        self._make_app(user_stats=stub)

        with self.app.test_client() as client:
            response = client.get('/api/stats/user/1')
            self.assertEqual(response.status_code, 500)
            self.assertIn('error', response.get_json())


if __name__ == '__main__':
    unittest.main()
