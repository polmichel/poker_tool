"""
Unit tests for Storage interface.
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from abc import ABC
from poker_tool.interfaces.storage import Storage


class TestStorageInterface(unittest.TestCase):
    """Tests for Storage interface."""

    def test_storage_is_abstract(self):
        """Test that Storage is an abstract base class."""
        self.assertTrue(issubclass(Storage, ABC))

    def test_storage_abstract_methods(self):
        """Test that Storage has required abstract methods."""
        # Check that all required methods are abstract
        required_methods = [
            'save',
            'get',
            'all',
            'remove',
            'ranges_by_user',
            'sessions_by_user',
            'user_by_email',
            'user_by_username',
        ]
        
        for method_name in required_methods:
            self.assertTrue(
                hasattr(Storage, method_name),
                f"Storage should have method: {method_name}"
            )
            method = getattr(Storage, method_name)
            self.assertTrue(
                getattr(method, '__isabstractmethod__', False),
                f"Method {method_name} should be abstract"
            )

    def test_cannot_instantiate_storage(self):
        """Test that Storage cannot be instantiated directly."""
        with self.assertRaises(TypeError):
            Storage()


if __name__ == '__main__':
    unittest.main()
