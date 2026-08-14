"""
Unit tests for the Users port (interface contract).
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from abc import ABC
from poker_tool.interfaces.users import Users


class TestUsersInterface(unittest.TestCase):
    """Tests for the Users interface."""

    def test_users_is_abstract(self):
        """Test that Users is an abstract base class."""
        self.assertTrue(issubclass(Users, ABC))

    def test_users_abstract_methods(self):
        """Test that Users has required abstract methods."""
        required_methods = [
            'add',
            'user_by_id',
            'user_by_username',
            'user_by_email',
            'all',
        ]
        for method_name in required_methods:
            self.assertTrue(
                hasattr(Users, method_name),
                f"Users should have method: {method_name}"
            )
            method = getattr(Users, method_name)
            self.assertTrue(
                getattr(method, '__isabstractmethod__', False),
                f"Method {method_name} should be abstract"
            )

    def test_cannot_instantiate_users(self):
        """Test that Users cannot be instantiated directly."""
        with self.assertRaises(TypeError):
            Users()


if __name__ == '__main__':
    unittest.main()
