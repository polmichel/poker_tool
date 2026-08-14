"""
Unit tests for the TrainingSessions port (interface contract).
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from abc import ABC
from poker_tool.interfaces.training_sessions import TrainingSessions


class TestTrainingSessionsInterface(unittest.TestCase):
    """Tests for the TrainingSessions interface."""

    def test_training_sessions_is_abstract(self):
        """Test that TrainingSessions is an abstract base class."""
        self.assertTrue(issubclass(TrainingSessions, ABC))

    def test_training_sessions_abstract_methods(self):
        """Test that TrainingSessions has required abstract methods."""
        required_methods = [
            'add',
            'session_by_id',
            'all',
            'sessions_by_user',
        ]
        for method_name in required_methods:
            self.assertTrue(
                hasattr(TrainingSessions, method_name),
                f"TrainingSessions should have method: {method_name}"
            )
            method = getattr(TrainingSessions, method_name)
            self.assertTrue(
                getattr(method, '__isabstractmethod__', False),
                f"Method {method_name} should be abstract"
            )

    def test_cannot_instantiate_training_sessions(self):
        """Test that TrainingSessions cannot be instantiated directly."""
        with self.assertRaises(TypeError):
            TrainingSessions()


if __name__ == '__main__':
    unittest.main()
