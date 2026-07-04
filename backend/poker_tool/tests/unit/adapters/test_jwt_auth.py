"""
Unit tests for JwtAuth adapter.
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch
from poker_tool.adapters.jwt.auth import JwtAuth
from poker_tool.interfaces.auth import Auth


class TestJwtAuth(unittest.TestCase):
    """Tests for JwtAuth class."""

    def setUp(self):
        """Set up test fixtures."""
        self.app = MagicMock()
        self.app.config = {}

    def test_jwt_auth_implements_auth(self):
        """Test that JwtAuth implements Auth interface."""
        self.assertTrue(issubclass(JwtAuth, Auth))

    def test_jwt_auth_creation(self):
        """Test JwtAuth creation."""
        with patch('poker_tool.adapters.jwt.auth.JWTManager') as mock_jwt:
            auth = JwtAuth(self.app)
            
            # Check that JWTManager was initialized
            mock_jwt.assert_called_once_with(self.app)
            
            # Check that JWT config was set
            self.assertEqual(self.app.config.get("JWT_SECRET_KEY"), "poker_tool_jwt_secret_key")
            self.assertEqual(self.app.config.get("JWT_ACCESS_TOKEN_EXPIRES"), 3600)

    def test_create_user(self):
        """Test create_user method."""
        with patch('poker_tool.adapters.jwt.auth.JWTManager'):
            auth = JwtAuth(self.app)
            
            user = auth.create_user("testuser", "test@example.com", "password123")
            
            self.assertEqual(user.username, "testuser")
            self.assertEqual(user.email, "test@example.com")
            self.assertIsNotNone(user.password_hash)
            self.assertIsNone(user.id)

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    @patch('poker_tool.adapters.jwt.auth.create_access_token')
    def test_generate_token(self, mock_create_token, mock_jwt):
        """Test generate_token method."""
        mock_create_token.return_value = "mock_token"
        
        auth = JwtAuth(self.app)
        user = auth.create_user("testuser", "test@example.com", "password123")
        user._id = 1  # Set ID manually for testing
        
        token = auth.generate_token(user)
        
        self.assertEqual(token, "mock_token")
        mock_create_token.assert_called_once_with(identity=1)

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    @patch('poker_tool.adapters.jwt.auth.decode_token')
    def test_verify_token(self, mock_decode_token, mock_jwt):
        """Test verify_token method."""
        mock_decode_token.return_value = {"sub": 1}
        
        auth = JwtAuth(self.app)
        
        user = auth.verify_token("mock_token")
        
        self.assertEqual(user.id, 1)
        mock_decode_token.assert_called_once_with("mock_token")

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    @patch('poker_tool.adapters.jwt.auth.decode_token')
    def test_verify_token_invalid(self, mock_decode_token, mock_jwt):
        """Test verify_token with invalid token."""
        mock_decode_token.side_effect = Exception("Invalid token")
        
        auth = JwtAuth(self.app)
        
        user = auth.verify_token("invalid_token")
        
        self.assertIsNone(user)

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    def test_generate_token_without_id(self, mock_jwt):
        """Test generate_token with user without ID."""
        auth = JwtAuth(self.app)
        user = auth.create_user("testuser", "test@example.com", "password123")
        
        with self.assertRaises(ValueError):
            auth.generate_token(user)

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    @patch('poker_tool.adapters.jwt.auth.get_jwt_identity')
    def test_current_user(self, mock_get_identity, mock_jwt):
        """Test current_user method."""
        mock_get_identity.return_value = 1
        
        auth = JwtAuth(self.app)
        
        user = auth.current_user()
        
        self.assertEqual(user.id, 1)
        mock_get_identity.assert_called_once()

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    @patch('poker_tool.adapters.jwt.auth.get_jwt_identity')
    def test_current_user_no_identity(self, mock_get_identity, mock_jwt):
        """Test current_user with no identity."""
        mock_get_identity.side_effect = Exception("No identity")
        
        auth = JwtAuth(self.app)
        
        user = auth.current_user()
        
        self.assertIsNone(user)

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    def test_hash_password(self, mock_jwt):
        """Test hash_password method."""
        with patch('poker_tool.adapters.jwt.auth.generate_password_hash') as mock_hash:
            mock_hash.return_value = "hashed_password"
            
            auth = JwtAuth(self.app)
            
            hashed = auth.hash_password("password123")
            
            self.assertEqual(hashed, "hashed_password")
            mock_hash.assert_called_once_with("password123")

    @patch('poker_tool.adapters.jwt.auth.JWTManager')
    def test_check_password(self, mock_jwt):
        """Test check_password method."""
        with patch('poker_tool.adapters.jwt.auth.check_password_hash') as mock_check:
            mock_check.return_value = True
            
            auth = JwtAuth(self.app)
            
            result = auth.check_password("password123", "hashed_password")
            
            self.assertTrue(result)
            mock_check.assert_called_once_with("hashed_password", "password123")


if __name__ == '__main__':
    unittest.main()
