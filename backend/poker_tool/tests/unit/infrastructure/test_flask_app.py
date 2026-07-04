"""
Unit tests for FlaskApp infrastructure.
"""
import unittest
from unittest.mock import MagicMock, patch
from flask import Flask
from poker_tool.infrastructure.web.flask_app import FlaskApp
from poker_tool.interfaces.storage import Storage
from poker_tool.interfaces.auth import Auth


class TestFlaskApp(unittest.TestCase):
    """Tests for FlaskApp class."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.storage = MagicMock(spec=Storage)
        self.auth = MagicMock(spec=Auth)

    def test_flask_app_creation(self):
        """Test FlaskApp creation."""
        flask_app = FlaskApp(self.app, self.storage, self.auth)
        
        self.assertEqual(flask_app.app, self.app)
        self.assertEqual(flask_app.storage, self.storage)
        self.assertEqual(flask_app.auth, self.auth)

    def test_flask_app_registers_routes(self):
        """Test that FlaskApp registers routes."""
        flask_app = FlaskApp(self.app, self.storage, self.auth)
        
        # Check that routes are registered
        with self.app.test_client() as client:
            # Test health endpoint
            response = client.get('/api/health')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['status'], 'healthy')
            self.assertEqual(data['version'], '1.0.0')

    @patch.object(Storage, 'all')
    def test_get_ranges_route(self, mock_all):
        """Test GET /api/ranges route."""
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType
        from poker_tool.objects.position import Position
        
        # Setup mock
        mock_range = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            range_id=1,
        )
        mock_all.return_value = [mock_range]
        
        flask_app = FlaskApp(self.app, self.storage, self.auth)
        
        with self.app.test_client() as client:
            response = client.get('/api/ranges')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertIsInstance(data, list)
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]['name'], 'Test Range')

    @patch.object(Storage, 'get')
    def test_get_range_route(self, mock_get):
        """Test GET /api/ranges/<id> route."""
        from poker_tool.objects.range import Range
        from poker_tool.objects.range_type import RangeType
        from poker_tool.objects.position import Position
        
        # Setup mock
        mock_range = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            range_id=1,
        )
        mock_get.return_value = mock_range
        
        flask_app = FlaskApp(self.app, self.storage, self.auth)
        
        with self.app.test_client() as client:
            response = client.get('/api/ranges/1')
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data['name'], 'Test Range')

    @patch.object(Storage, 'get')
    def test_get_range_route_not_found(self, mock_get):
        """Test GET /api/ranges/<id> route with non-existent range."""
        mock_get.return_value = None
        
        flask_app = FlaskApp(self.app, self.storage, self.auth)
        
        with self.app.test_client() as client:
            response = client.get('/api/ranges/999')
            self.assertEqual(response.status_code, 404)

    @patch.object(Storage, 'save')
    @patch.object(Auth, 'current_user')
    def test_create_range_route(self, mock_current_user, mock_save):
        """Test POST /api/ranges route."""
        from poker_tool.objects.range import Range
        from poker_tool.objects.user import User
        
        # Setup mocks
        mock_user = User("testuser", "test@example.com", user_id=1)
        mock_current_user.return_value = mock_user
        
        mock_range = Range(
            name="New Range",
            range_type=None,
            position=None,
            user_id=1,
        )
        mock_save.return_value = mock_range
        
        flask_app = FlaskApp(self.app, self.storage, self.auth)
        
        with self.app.test_client() as client:
            response = client.post(
                '/api/ranges',
                json={'name': 'New Range'}
            )
            self.assertEqual(response.status_code, 201)
            data = response.get_json()
            self.assertEqual(data['name'], 'New Range')

    def test_create_range_route_missing_name(self):
        """Test POST /api/ranges route with missing name."""
        flask_app = FlaskApp(self.app, self.storage, self.auth)
        
        with self.app.test_client() as client:
            response = client.post('/api/ranges', json={})
            self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()
