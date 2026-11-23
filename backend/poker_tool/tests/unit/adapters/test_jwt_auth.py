"""
Unit tests for JwtAuth adapter.
"""

import os
import sys
import unittest

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch

from poker_tool.adapters.jwt.auth import JwtAuth
from poker_tool.config import Config
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

    def test_jwt_auth_creation_without_config(self):
        """Test JwtAuth creation falls back to dev defaults when no config."""
        with patch("poker_tool.adapters.jwt.auth.JWTManager") as mock_jwt:
            JwtAuth(self.app)

            # Check that JWTManager was initialized
            mock_jwt.assert_called_once_with(self.app)

            # Without a Config, dev defaults are applied.
            self.assertEqual(self.app.config.get("JWT_SECRET_KEY"), "poker_tool_dev_jwt_secret_key")
            self.assertEqual(self.app.config.get("JWT_ACCESS_TOKEN_EXPIRES"), 3600)

    def test_jwt_auth_creation_with_config(self):
        """Test JwtAuth uses the injected Config for secrets and expiry."""
        config = Config(
            {
                "JWT_SECRET_KEY": "injected-jwt-secret",
                "JWT_ACCESS_TOKEN_EXPIRES": "7200",
            }
        )
        with patch("poker_tool.adapters.jwt.auth.JWTManager"):
            JwtAuth(self.app, config)

            self.assertEqual(self.app.config.get("JWT_SECRET_KEY"), "injected-jwt-secret")
            self.assertEqual(self.app.config.get("JWT_ACCESS_TOKEN_EXPIRES"), 7200)

    def test_create_user(self):
        """Test create_user method."""
        with patch("poker_tool.adapters.jwt.auth.JWTManager"):
            auth = JwtAuth(self.app)

            user = auth.create_user("testuser", "test@example.com", "password123")

            self.assertEqual(user.username, "testuser")
            self.assertEqual(user.email, "test@example.com")
            self.assertIsNotNone(user.password_hash)
            self.assertIsNone(user.id)

    @patch("poker_tool.adapters.jwt.auth.JWTManager")
    @patch("poker_tool.adapters.jwt.auth.create_access_token")
    def test_generate_token(self, mock_create_token, mock_jwt):
        """Test generate_token method."""
        mock_create_token.return_value = "mock_token"

        auth = JwtAuth(self.app)
        user = auth.create_user("testuser", "test@example.com", "password123")
        user._id = 1  # Set ID manually for testing

        token = auth.generate_token(user)

        self.assertEqual(token, "mock_token")
        mock_create_token.assert_called_once_with(identity="1")

    @patch("poker_tool.adapters.jwt.auth.JWTManager")
    def test_generate_token_without_id(self, mock_jwt):
        """Test generate_token with user without ID."""
        auth = JwtAuth(self.app)
        user = auth.create_user("testuser", "test@example.com", "password123")

        with self.assertRaises(ValueError):
            auth.generate_token(user)

    @patch("poker_tool.adapters.jwt.auth.JWTManager")
    @patch("poker_tool.adapters.jwt.auth.verify_jwt_in_request")
    @patch("poker_tool.adapters.jwt.auth.get_jwt_identity")
    def test_current_user(self, mock_get_identity, mock_verify, mock_jwt):
        """Test current_user method."""
        mock_get_identity.return_value = 1

        auth = JwtAuth(self.app)

        user = auth.current_user()

        self.assertEqual(user.id, 1)
        mock_verify.assert_called_once_with(optional=True)
        mock_get_identity.assert_called_once()

    @patch("poker_tool.adapters.jwt.auth.JWTManager")
    @patch("poker_tool.adapters.jwt.auth.verify_jwt_in_request")
    @patch("poker_tool.adapters.jwt.auth.get_jwt_identity")
    def test_current_user_no_identity(self, mock_get_identity, mock_verify, mock_jwt):
        """Test current_user with no identity."""
        mock_get_identity.side_effect = Exception("No identity")

        auth = JwtAuth(self.app)

        user = auth.current_user()

        self.assertIsNone(user)

    def test_current_user_resolves_token_on_unprotected_route(self):
        """current_user must resolve the identity on routes without @jwt_required.

        Regression test: get_jwt_identity() raises unless verify_jwt_in_request()
        ran, so POST /training/sessions (no user_id in body) used to fail with
        400 "User required" even with a valid Bearer token, which broke the
        questionnaire E2E flow.
        """
        from flask import Flask
        from flask_jwt_extended import create_access_token

        app = Flask(__name__)
        auth = JwtAuth(app, Config({"JWT_SECRET_KEY": "test-secret-key-0123456789abcdef"}))

        @app.route("/open")
        def open_route():
            user = auth.current_user()
            return {"id": user.id if user else None}

        with app.app_context():
            token = create_access_token(identity="42")

        with app.test_client() as client:
            self.assertIsNone(client.get("/open").get_json()["id"])
            response = client.get("/open", headers={"Authorization": f"Bearer {token}"})
            self.assertEqual(response.get_json()["id"], 42)

    @patch("poker_tool.adapters.jwt.auth.JWTManager")
    def test_check_password(self, mock_jwt):
        """Test check_password method."""
        with patch("poker_tool.adapters.jwt.auth.check_password_hash") as mock_check:
            mock_check.return_value = True

            auth = JwtAuth(self.app)

            result = auth.check_password("password123", "hashed_password")

            self.assertTrue(result)
            mock_check.assert_called_once_with("hashed_password", "password123")


if __name__ == "__main__":
    unittest.main()
