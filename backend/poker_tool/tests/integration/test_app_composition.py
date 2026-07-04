"""
Integration tests for application composition.
Tests that all components work together correctly.
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch
from flask import Flask
from poker_tool.app import PokerTool
from poker_tool.interfaces.storage import Storage
from poker_tool.interfaces.auth import Auth


class TestAppComposition(unittest.TestCase):
    """Tests for application composition."""

    def test_app_creation(self):
        """Test that PokerTool can be created successfully."""
        # This test verifies that all dependencies can be composed together
        app = PokerTool()
        
        self.assertIsNotNone(app)
        self.assertIsNotNone(app.app)
        self.assertIsInstance(app.app, Flask)
        self.assertIsNotNone(app.storage)
        self.assertIsInstance(app.storage, Storage)
        self.assertIsNotNone(app.auth)
        self.assertIsInstance(app.auth, Auth)
        self.assertIsNotNone(app.flask_app)

    def test_app_config(self):
        """Test that Flask app is configured correctly."""
        app = PokerTool()
        
        self.assertEqual(app.app.config.get("SECRET_KEY"), "poker_tool_secret_key")
        self.assertEqual(app.app.config.get("SQLALCHEMY_DATABASE_URI"), "sqlite:///poker_tool.db")
        self.assertEqual(app.app.config.get("SQLALCHEMY_TRACK_MODIFICATIONS"), False)

    @patch('poker_tool.app.CORS')
    def test_cors_configuration(self, mock_cors):
        """Test that CORS is configured."""
        app = PokerTool()
        
        # Check that CORS was initialized
        mock_cors.assert_called_once()
        # Check the arguments passed to CORS
        cors_instance = mock_cors.call_args[0][0]  # First argument is the Flask app
        resources_arg = mock_cors.call_args[1].get('resources')
        self.assertEqual(resources_arg, {r"/*": {"origins": "*"}})


class TestObjectCreationFlow(unittest.TestCase):
    """Tests for object creation flow."""

    def test_range_creation_flow(self):
        """Test creating a Range through the domain layer."""
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType
        from poker_tool.objects.position import Position
        from poker_tool.objects.action import Action, ActionType
        
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
        from unittest.mock import patch
        from poker_tool.objects.user import User
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType
        from poker_tool.objects.position import Position
        from poker_tool.objects.action import Action, ActionType
        from poker_tool.objects.training.session import TrainingSession
        
        # Create dependencies
        user = User("testuser", "test@example.com", user_id=1)
        range_obj = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            hands={"AKs": Action(ActionType.RAISE), "TT": Action(ActionType.OPEN)},
            range_id=1,
        )
        
        # Mock random to avoid randomness in tests
        with patch('poker_tool.objects.training.session.random.sample') as mock_sample:
            mock_sample.return_value = ["AKs", "TT"]
            
            # Create session
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
            
            # Answer a question
            new_session = session.answer("raise")
            self.assertEqual(new_session.current_index, 1)
            self.assertEqual(new_session.correct_answers, 1)


class TestInterfaceImplementations(unittest.TestCase):
    """Tests that interface implementations work correctly."""

    def test_storage_interface_implementation(self):
        """Test that SqlAlchemyStorage implements Storage correctly."""
        from poker_tool.adapters.sqlalchemy.storage import SqlAlchemyStorage
        from poker_tool.interfaces.storage import Storage
        
        # Verify inheritance
        self.assertTrue(issubclass(SqlAlchemyStorage, Storage))
        
        # Verify all abstract methods are implemented
        required_methods = [
            'save', 'get', 'all', 'remove',
            'ranges_by_user', 'sessions_by_user',
            'user_by_email', 'user_by_username'
        ]
        
        for method_name in required_methods:
            self.assertTrue(
                hasattr(SqlAlchemyStorage, method_name),
                f"SqlAlchemyStorage should implement {method_name}"
            )

    def test_auth_interface_implementation(self):
        """Test that JwtAuth implements Auth correctly."""
        from poker_tool.adapters.jwt.auth import JwtAuth
        from poker_tool.interfaces.auth import Auth
        
        # Verify inheritance
        self.assertTrue(issubclass(JwtAuth, Auth))
        
        # Verify all abstract methods are implemented
        required_methods = [
            'create_user', 'authenticate', 'current_user',
            'generate_token', 'verify_token'
        ]
        
        for method_name in required_methods:
            self.assertTrue(
                hasattr(JwtAuth, method_name),
                f"JwtAuth should implement {method_name}"
            )


if __name__ == '__main__':
    unittest.main()
