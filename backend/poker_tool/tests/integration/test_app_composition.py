"""
Integration tests for application composition.
Tests that all components work together correctly.
"""
import os
import sys
import unittest

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import patch

from flask import Flask

from poker_tool.app import PokerTool
from poker_tool.config import Config
from poker_tool.interfaces.auth import Auth
from poker_tool.interfaces.ranges import Ranges
from poker_tool.interfaces.training_sessions import TrainingSessions
from poker_tool.interfaces.users import Users


class TestAppComposition(unittest.TestCase):
    """Tests for application composition."""

    def test_app_creation(self):
        """Test that PokerTool can be created successfully."""
        # This test verifies that all dependencies can be composed together
        app = PokerTool()

        self.assertIsNotNone(app)
        self.assertIsNotNone(app.app)
        self.assertIsInstance(app.app, Flask)
        self.assertIsNotNone(app.users)
        self.assertIsInstance(app.users, Users)
        self.assertIsNotNone(app.ranges)
        self.assertIsInstance(app.ranges, Ranges)
        self.assertIsNotNone(app.sessions)
        self.assertIsInstance(app.sessions, TrainingSessions)
        self.assertIsNotNone(app.auth)
        self.assertIsInstance(app.auth, Auth)
        self.assertIsNotNone(app.flask_app)

    def test_app_config(self):
        """Test that Flask app is configured from the injected Config."""
        app = PokerTool()

        self.assertEqual(app.app.config.get("SECRET_KEY"), app.config.secret_key)
        self.assertEqual(app.app.config.get("SQLALCHEMY_DATABASE_URI"), app.config.database_uri)
        self.assertEqual(app.app.config.get("SQLALCHEMY_TRACK_MODIFICATIONS"), False)
        self.assertEqual(app.app.config.get("JWT_SECRET_KEY"), app.config.jwt_secret_key)

    def test_config_is_injected_from_environment(self):
        """Test that Config reads values from the environment."""
        env = {
            "SECRET_KEY": "env-secret",
            "JWT_SECRET_KEY": "env-jwt-secret",
            "DATABASE_URL": "sqlite:///custom.db",
            "CORS_ORIGINS": "http://localhost:3000,http://localhost:4000",
            "JWT_ACCESS_TOKEN_EXPIRES": "7200",
        }
        config = Config(env)
        self.assertEqual(config.secret_key, "env-secret")
        self.assertEqual(config.jwt_secret_key, "env-jwt-secret")
        self.assertEqual(config.database_uri, "sqlite:///custom.db")
        self.assertEqual(config.cors_origins, ["http://localhost:3000", "http://localhost:4000"])
        self.assertEqual(config.jwt_access_token_expires_seconds, 7200)

    def test_config_defaults(self):
        """Test that Config provides safe defaults for development."""
        config = Config({})
        self.assertEqual(config.secret_key, "poker_tool_dev_secret_key")
        self.assertEqual(config.jwt_secret_key, "poker_tool_dev_jwt_secret_key")
        self.assertEqual(config.database_uri, "sqlite:///poker_tool.db")
        self.assertEqual(config.cors_origins, ["*"])
        self.assertEqual(config.jwt_access_token_expires_seconds, 3600)

    @patch('poker_tool.app.CORS')
    def test_cors_configuration(self, mock_cors):
        """Test that CORS is configured from the injected Config."""
        app = PokerTool()

        # Check that CORS was initialized
        mock_cors.assert_called_once()
        # Check the arguments passed to CORS
        mock_cors.call_args[0][0]  # First argument is the Flask app
        resources_arg = mock_cors.call_args[1].get('resources')
        self.assertEqual(resources_arg, {r"/*": {"origins": app.config.cors_origins}})


class TestObjectCreationFlow(unittest.TestCase):
    """Tests for object creation flow."""

    def test_range_creation_flow(self):
        """Test creating a Range through the domain layer."""
        from poker_tool.objects.action import Action, ActionType
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType

        # Create a range
        range_obj = Range(
            name="Test Range",
            description="A test range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            hands={"AKs": Action(ActionType.RAISE)},
            user_id=1,
        )

        self.assertEqual(range_obj.name, "Test Range")
        self.assertEqual(range_obj.type, RangeType.PREFLOP)
        self.assertEqual(range_obj.position, Position.BTN)

        # Test immutability - with_hand
        new_range = range_obj.with_hand("TT", Action(ActionType.OPEN))
        self.assertEqual(len(new_range.hands), 2)
        self.assertEqual(len(range_obj.hands), 1)  # Original unchanged

        # Test serialization
        range_dict = range_obj.to_dict()
        self.assertIn("name", range_dict)
        self.assertIn("range_type", range_dict)

        # Test deserialization
        reconstructed = Range.from_dict(range_dict)
        self.assertEqual(reconstructed.name, range_obj.name)

    def test_user_creation_flow(self):
        """Test creating a User through the domain layer."""
        from poker_tool.objects.user import User

        # Create a user
        user = User(
            username="testuser",
            email="test@example.com",
            password_hash="hashed_password",
            user_id=1,
        )

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")

        # Test serialization
        user_dict = user.to_dict()
        self.assertIn("username", user_dict)
        self.assertIn("email", user_dict)

        # Test deserialization
        reconstructed = User.from_dict(user_dict)
        self.assertEqual(reconstructed.username, user.username)

    def test_training_session_flow(self):
        """Test creating a TrainingSession."""
        from poker_tool.objects.action import Action, ActionType
        from poker_tool.objects.position import Position
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType
        from poker_tool.objects.training.session import TrainingSession
        from poker_tool.objects.user import User

        # Create dependencies
        user = User("testuser", "test@example.com", user_id=1)
        range_obj = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            hands={"AKs": Action(ActionType.RAISE), "TT": Action(ActionType.OPEN)},
            range_id=1,
        )

        # Mode "fill" is now a grid-painting exercise: a single question whose
        # correct answer is the full 169-cell reference range (JSON). No
        # random sampling is involved for "fill" anymore.
        import json

        session = TrainingSession(
            user=user,
            range_obj=range_obj,
            mode="fill",
            total_questions=2,
            session_id=1,
        )

        self.assertEqual(session.user, user)
        self.assertEqual(session.range, range_obj)
        self.assertEqual(session.mode, "fill")
        # One grid question, typed grid_paint.
        self.assertEqual(len(session._questions), 1)
        self.assertEqual(session.current_question.type, "grid_paint")

        # Answer with the exact reference grid -> all 169 cells correct.
        reference = json.loads(session.current_question.correct_answer)
        new_session = session.answer(json.dumps(reference))
        self.assertEqual(new_session.current_index, 1)
        self.assertTrue(new_session.is_complete)
        self.assertEqual(new_session.correct_answers, 169)
        self.assertEqual(new_session.score, 100.0)


class TestInterfaceImplementations(unittest.TestCase):
    """Tests that interface implementations work correctly."""

    def test_users_interface_implementation(self):
        """Test that SqlUsers implements the Users port correctly."""
        from poker_tool.adapters.sqlalchemy.users import SqlUsers
        from poker_tool.interfaces.users import Users

        self.assertTrue(issubclass(SqlUsers, Users))
        for method_name in ['add', 'user_by_id', 'user_by_username', 'user_by_email', 'all']:
            self.assertTrue(hasattr(SqlUsers, method_name), f"SqlUsers should implement {method_name}")

    def test_ranges_interface_implementation(self):
        """Test that SqlRanges implements the Ranges port correctly."""
        from poker_tool.adapters.sqlalchemy.ranges import SqlRanges
        from poker_tool.interfaces.ranges import Ranges

        self.assertTrue(issubclass(SqlRanges, Ranges))
        for method_name in ['add', 'range_by_id', 'all', 'remove', 'ranges_by_user']:
            self.assertTrue(hasattr(SqlRanges, method_name), f"SqlRanges should implement {method_name}")

    def test_training_sessions_interface_implementation(self):
        """Test that SqlTrainingSessions implements the TrainingSessions port."""
        from poker_tool.adapters.sqlalchemy.training_sessions import SqlTrainingSessions
        from poker_tool.interfaces.training_sessions import TrainingSessions

        self.assertTrue(issubclass(SqlTrainingSessions, TrainingSessions))
        for method_name in ['add', 'session_by_id', 'all', 'sessions_by_user']:
            self.assertTrue(
                hasattr(SqlTrainingSessions, method_name),
                f"SqlTrainingSessions should implement {method_name}"
            )

    def test_auth_interface_implementation(self):
        """Test that JwtAuth implements Auth correctly."""
        from poker_tool.adapters.jwt.auth import JwtAuth
        from poker_tool.interfaces.auth import Auth

        # Verify inheritance
        self.assertTrue(issubclass(JwtAuth, Auth))

        # Verify all abstract methods are implemented
        required_methods = [
            'create_user', 'current_user',
            'generate_token'
        ]

        for method_name in required_methods:
            self.assertTrue(
                hasattr(JwtAuth, method_name),
                f"JwtAuth should implement {method_name}"
            )


class TestEquityEndpoint(unittest.TestCase):
    """Integration tests for the /api/equity/simulate endpoint."""

    def setUp(self):
        """Create a test client."""
        self.app = PokerTool()
        self.client = self.app.app.test_client()

    def test_simulate_returns_equity(self):
        """Test that the endpoint returns win/tie/lose percentages."""
        resp = self.client.post(
            "/api/equity/simulate",
            json={"hero": "AKs", "range": "QQ", "iterations": 1000},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["hero"], "AKs")
        for key in ("win", "tie", "lose", "iterations", "by_hand"):
            self.assertIn(key, data)
        self.assertEqual(data["iterations"], 1000)
        self.assertGreaterEqual(data["win"] + data["tie"] + data["lose"], 99.9)

    def test_simulate_range_notation(self):
        """Test that range notation (KK+) is accepted and expanded."""
        resp = self.client.post(
            "/api/equity/simulate",
            json={"hero": "AA", "range": "KK", "iterations": 1000},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        # AA vs KK should be heavily dominant (~80/20).
        self.assertGreater(data["win"], 70.0)
        # Verify the range was expanded into a single hand breakdown.
        self.assertEqual(len(data["by_hand"]), 1)
        self.assertEqual(data["by_hand"][0]["hand"], "KK")

    def test_missing_hero_returns_400(self):
        """Test that a missing hero field returns 400."""
        resp = self.client.post(
            "/api/equity/simulate",
            json={"range": "QQ"},
        )
        self.assertEqual(resp.status_code, 400)

    def test_invalid_hero_returns_400(self):
        """Test that an invalid hero returns 400."""
        resp = self.client.post(
            "/api/equity/simulate",
            json={"hero": "ZZ", "range": "QQ"},
        )
        self.assertEqual(resp.status_code, 400)

    def test_missing_range_returns_400(self):
        """Test that a missing range returns 400."""
        resp = self.client.post(
            "/api/equity/simulate",
            json={"hero": "AKs"},
        )
        self.assertEqual(resp.status_code, 400)

    def test_invalid_range_returns_400(self):
        """Test that invalid range notation returns 400."""
        resp = self.client.post(
            "/api/equity/simulate",
            json={"hero": "AKs", "range": "ZZ"},
        )
        self.assertEqual(resp.status_code, 400)


if __name__ == '__main__':
    unittest.main()

