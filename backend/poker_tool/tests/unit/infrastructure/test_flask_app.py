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
        if self._result is None:
            return {}
        return self._result


class _StubUserStats(UserStats):
    """Fake UserStats use case returning a fixed result or raising."""

    def __init__(self, result: dict | None = None, error: Exception | None = None):
        self._result = result
        self._error = error

    def compute(self, user_id: int) -> dict:
        if self._error is not None:
            raise self._error
        if self._result is None:
            return {}
        return self._result


class TestFlaskApp(unittest.TestCase):
    """Tests for FlaskApp class."""

    def setUp(self):
        """Set up test fixtures with in-memory ports and real use cases."""
        self.app = Flask(__name__)
        self.app.config["TESTING"] = True
        self.users = FakeUsers()
        self.ranges = FakeRanges()
        self.sessions = FakeSessions()
        self.auth = FakeAuth()
        self.resolve_user = ResolveUser(self.users, self.auth)
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
            self.ranges,
            self.sessions,
            self.resolve_user,
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
            get_all_ranges=self.get_all_ranges,
            get_range_by_id=self.get_range_by_id,
            get_ranges_by_user=self.get_ranges_by_user,
            delete_range=self.delete_range,
            start_training=self.start_training,
            answer_question=self.answer_question,
            end_training=self.end_training,
            global_stats=global_stats or self.global_stats,
            user_stats=user_stats or self.user_stats,
            table_equity=equity_calculator or FakeEquityCalculator(),
            monte_carlo_equity=FakeEquityCalculator(),
        )

    def test_flask_app_creation(self):
        """Test FlaskApp creation exposes the injected app."""
        flask_app = self._make_app()
        self.assertEqual(flask_app.app, self.app)
        # FlaskApp no longer stores ports directly, only the app

    def test_flask_app_registers_routes(self):
        """Test that FlaskApp registers routes."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.get("/api/health")
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data["status"], "healthy")
            self.assertEqual(data["version"], "1.0.0")

    def test_get_ranges_route(self):
        """Test GET /api/ranges route lists ranges stored in the fake."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        self.ranges.add(
            Range(
                name="Test Range",
                range_type=RangeType.PREFLOP,
                position=Position.BTN,
                range_id=1,
            )
        )
        self._make_app()

        with self.app.test_client() as client:
            response = client.get("/api/ranges")
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertIsInstance(data, list)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]["name"], "Test Range")

    def test_get_range_route(self):
        """Test GET /api/ranges/<id> route returns a stored range."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        stored = self.ranges.add(
            Range(
                name="Test Range",
                range_type=RangeType.PREFLOP,
                position=Position.BTN,
            )
        )
        self._make_app()

        with self.app.test_client() as client:
            response = client.get(f"/api/ranges/{stored.id}")
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data["name"], "Test Range")

    def test_get_range_route_not_found(self):
        """Test GET /api/ranges/<id> route with non-existent range (404)."""
        # FakeRanges is empty, so range_by_id returns None -> 404.
        self._make_app()

        with self.app.test_client() as client:
            response = client.get("/api/ranges/999")
            self.assertEqual(response.status_code, 404)

    def test_create_range_route(self):
        """Test POST /api/ranges route delegates to the CreateRange use case."""
        self._make_app()

        with self.app.test_client() as client:
            response = client.post("/api/ranges", json={"name": "New Range"})
            self.assertEqual(response.status_code, 201)
            data = response.get_json()
            self.assertEqual(data["name"], "New Range")
        # The range was actually stored in the fake.
        self.assertEqual(len(self.ranges.all()), 1)
        self.assertEqual(self.ranges.all()[0].name, "New Range")

    def test_create_range_route_missing_name(self):
        """Test POST /api/ranges route with missing name."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.post("/api/ranges", json={})
            self.assertEqual(response.status_code, 400)

    def test_get_global_stats_route(self):
        """Test GET /api/stats/global delegates to the GlobalStats use case."""
        stub = _StubGlobalStats(
            result={
                "total_ranges": 2,
                "total_users": 1,
                "total_sessions": 3,
                "total_hands": 5,
                "avg_score": 4.5,
                "most_common_action": "RAISE",
            }
        )
        self._make_app(global_stats=stub)

        with self.app.test_client() as client:
            response = client.get("/api/stats/global")
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data["total_ranges"], 2)
            self.assertEqual(data["total_sessions"], 3)
            self.assertEqual(data["avg_score"], 4.5)
            self.assertEqual(data["most_common_action"], "RAISE")

    def test_get_global_stats_route_error(self):
        """Test GET /api/stats/global returns a JSON 500 when the use case fails.

        This is the backend side of the "Erreur lors du chargement des
        statistiques globales" message shown on the home page: a use-case
        failure surfaces as a structured JSON 500 (not Flask's default HTML
        error page) so the frontend receives a clean error body.
        """
        stub = _StubGlobalStats(error=RuntimeError("db down"))
        self._make_app(global_stats=stub)

        with self.app.test_client() as client:
            response = client.get("/api/stats/global")
            self.assertEqual(response.status_code, 500)
            self.assertEqual(response.get_json()["error"], "Erreur lors du chargement des statistiques globales")

    def test_get_user_stats_route(self):
        """Test GET /api/stats/user/<id> delegates to the UserStats use case."""
        stub = _StubUserStats(
            result={
                "user_id": 1,
                "total_sessions": 2,
                "avg_score": 3.0,
                "total_time_spent": 120,
                "best_score": 5.0,
                "most_played_range": "R1",
            }
        )
        self._make_app(user_stats=stub)

        with self.app.test_client() as client:
            response = client.get("/api/stats/user/1")
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data["user_id"], 1)
            self.assertEqual(data["total_sessions"], 2)

    def test_get_user_stats_route_not_found(self):
        """Test GET /api/stats/user/<id> returns 404 for an unknown user.

        The real UserStats raises UserNotFound when the user is absent from
        the (empty) FakeUsers store, which the controller maps to 404.
        """
        self._make_app()

        with self.app.test_client() as client:
            response = client.get("/api/stats/user/999")
            self.assertEqual(response.status_code, 404)

    def test_get_user_stats_route_error(self):
        """Test GET /api/stats/user/<id> returns a JSON 500 on unexpected failure."""
        stub = _StubUserStats(error=RuntimeError("db down"))
        self._make_app(user_stats=stub)

        with self.app.test_client() as client:
            response = client.get("/api/stats/user/1")
            self.assertEqual(response.status_code, 500)
            self.assertIn("error", response.get_json())

    def test_import_range_route_text(self):
        """Test POST /api/ranges/import with text content stores a range (201)."""
        self._make_app()

        with self.app.test_client() as client:
            response = client.post(
                "/api/ranges/import",
                json={"content": "66+, A8s+: open\n72o: call", "format": "text", "name": "Imported"},
            )
            self.assertEqual(response.status_code, 201)
            data = response.get_json()
            self.assertEqual(data["name"], "Imported")
            self.assertIn("AA", data["hands"])
            self.assertIn("66", data["hands"])
            self.assertIn("AKs", data["hands"])
            self.assertEqual(data["hands"]["AA"], "open")
            self.assertEqual(data["hands"]["72o"], "call")
        self.assertEqual(len(self.ranges.all()), 1)

    def test_import_range_route_json(self):
        """Test POST /api/ranges/import with JSON content round-trips through from_dict."""
        import json

        self._make_app()
        content = json.dumps(
            {
                "name": "UTG open",
                "description": "Ouverture UTG",
                "range_type": "preflop",
                "position": "UTG",
                "hands": {"AA": "open", "AKs": "open"},
            }
        )

        with self.app.test_client() as client:
            response = client.post("/api/ranges/import", json={"content": content, "format": "json"})
            self.assertEqual(response.status_code, 201)
            data = response.get_json()
            self.assertEqual(data["name"], "UTG open")
            self.assertEqual(data["position"], "UTG")
            self.assertEqual(data["hands"], {"AA": "open", "AKs": "open"})

    def test_import_range_route_csv(self):
        """Test POST /api/ranges/import with CSV content."""
        self._make_app()

        with self.app.test_client() as client:
            response = client.post(
                "/api/ranges/import",
                json={"content": "hand,action\nAA,open\nKK,raise", "format": "csv"},
            )
            self.assertEqual(response.status_code, 201)
            data = response.get_json()
            self.assertEqual(data["hands"], {"AA": "open", "KK": "raise"})

    def test_import_range_route_missing_content(self):
        """Test POST /api/ranges/import without content returns 400."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.post("/api/ranges/import", json={"format": "text"})
            self.assertEqual(response.status_code, 400)

    def test_import_range_route_invalid_content(self):
        """Test POST /api/ranges/import with an invalid hand returns a JSON 400."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.post(
                "/api/ranges/import",
                json={"content": "XX: open", "format": "text"},
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("error", response.get_json())

    def test_import_range_route_unsupported_format(self):
        """Test POST /api/ranges/import with an unknown format returns 400."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.post(
                "/api/ranges/import",
                json={"content": "AA: open", "format": "xml"},
            )
            self.assertEqual(response.status_code, 400)

    def test_export_range_route_formats(self):
        """Test GET /api/ranges/export/<id> serves json, text and csv formats."""
        from poker_tool.objects.action import Action, ActionType
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        stored = self.ranges.add(
            Range(
                name="Export me",
                range_type=RangeType.PREFLOP,
                position=Position.BTN,
                hands={"AA": Action(ActionType.OPEN), "72o": Action(ActionType.CALL)},
            )
        )
        self._make_app()

        with self.app.test_client() as client:
            response = client.get(f"/api/ranges/export/{stored.id}?format=json")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json()["hands"], {"AA": "open", "72o": "call"})

            response = client.get(f"/api/ranges/export/{stored.id}?format=text")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(set(response.get_json()["text"].splitlines()), {"AA: open", "72o: call"})

            response = client.get(f"/api/ranges/export/{stored.id}?format=csv")
            self.assertEqual(response.status_code, 200)
            rows = response.get_json()["csv"].splitlines()
            self.assertEqual(rows[0], "hand,action")
            self.assertEqual(set(rows[1:]), {"AA,open", "72o,call"})

    def test_export_range_route_not_found(self):
        """Test GET /api/ranges/export/<id> with unknown id returns 404."""
        self._make_app()
        with self.app.test_client() as client:
            response = client.get("/api/ranges/export/999?format=json")
            self.assertEqual(response.status_code, 404)

    def test_export_range_route_bad_format(self):
        """Test GET /api/ranges/export/<id> with unknown format returns 400."""
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        stored = self.ranges.add(Range(name="R", range_type=RangeType.PREFLOP, position=Position.BTN))
        self._make_app()
        with self.app.test_client() as client:
            response = client.get(f"/api/ranges/export/{stored.id}?format=xml")
            self.assertEqual(response.status_code, 400)

    def test_import_export_round_trip_route(self):
        """Test export -> import round-trip preserves the hands of a range."""
        from poker_tool.objects.action import Action, ActionType
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        stored = self.ranges.add(
            Range(
                name="Round trip",
                range_type=RangeType.PREFLOP,
                position=Position.CO,
                hands={"AA": Action(ActionType.OPEN), "AKs": Action(ActionType.OPEN), "72o": Action(ActionType.FOLD)},
            )
        )
        self._make_app()

        with self.app.test_client() as client:
            exported = client.get(f"/api/ranges/export/{stored.id}?format=text").get_json()["text"]
            response = client.post(
                "/api/ranges/import",
                json={"content": exported, "format": "text", "name": "Round trip copy"},
            )
            self.assertEqual(response.status_code, 201)
            imported = response.get_json()
            self.assertEqual(imported["hands"], {"AA": "open", "AKs": "open", "72o": "fold"})
            self.assertEqual(len(self.ranges.all()), 2)
            re_exported = client.get(f"/api/ranges/export/{imported['id']}?format=json").get_json()
            self.assertEqual(re_exported["hands"], imported["hands"])


if __name__ == "__main__":
    unittest.main()
