"""
Unit tests for Auth interface.
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from abc import ABC
from poker_tool.interfaces.auth import Auth


class TestAuthInterface(unittest.TestCase):
    """Tests for Auth interface."""

    def test_auth_is_abstract(self):
        """Test that Auth is an abstract base class."""
        self.assertTrue(issubclass(Auth, ABC))

    def test_auth_abstract_methods(self):
        """Test that Auth has required abstract methods."""
        # Check that all required methods are abstract
        required_methods = [
            'create_user',
            'authenticate',
            'current_user',
            'generate_token',
            'verify_token',
        ]
        
        for method_name in required_methods:
            self.assertTrue(
                hasattr(Auth, method_name),
                f"Auth should have method: {method_name}"
            )
            method = getattr(Auth, method_name)
            self.assertTrue(
                getattr(method, '__isabstractmethod__', False),
                f"Method {method_name} should be abstract"
            )

    def test_cannot_instantiate_auth(self):
        """Test that Auth cannot be instantiated directly."""
        with self.assertRaises(TypeError):
            Auth()


if __name__ == '__main__':
    unittest.main()
