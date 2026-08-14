"""
Unit tests for the Ranges port (interface contract).
"""
import os
import sys
import unittest

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from abc import ABC

from poker_tool.interfaces.ranges import Ranges


class TestRangesInterface(unittest.TestCase):
    """Tests for the Ranges interface."""

    def test_ranges_is_abstract(self):
        """Test that Ranges is an abstract base class."""
        self.assertTrue(issubclass(Ranges, ABC))

    def test_ranges_abstract_methods(self):
        """Test that Ranges has required abstract methods."""
        required_methods = [
            'add',
            'range_by_id',
            'all',
            'remove',
            'ranges_by_user',
        ]
        for method_name in required_methods:
            self.assertTrue(
                hasattr(Ranges, method_name),
                f"Ranges should have method: {method_name}"
            )
            method = getattr(Ranges, method_name)
            self.assertTrue(
                getattr(method, '__isabstractmethod__', False),
                f"Method {method_name} should be abstract"
            )

    def test_cannot_instantiate_ranges(self):
        """Test that Ranges cannot be instantiated directly."""
        with self.assertRaises(TypeError):
            Ranges()


if __name__ == '__main__':
    unittest.main()
