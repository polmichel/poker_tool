"""
Unit tests for the SqlTrainingSessions adapter.
"""
import os
import sys
import unittest

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch

from flask import Flask

from poker_tool.adapters.sqlalchemy.training_sessions import SqlTrainingSessions
from poker_tool.interfaces.training_sessions import TrainingSessions


class TestSqlTrainingSessions(unittest.TestCase):
    """Tests for SqlTrainingSessions class."""

    def test_sql_training_sessions_implements_training_sessions(self):
        """Test that SqlTrainingSessions implements the TrainingSessions interface."""
        self.assertTrue(issubclass(SqlTrainingSessions, TrainingSessions))

    def test_sql_training_sessions_creation(self):
        """Test SqlTrainingSessions creation delegates to the shared SQLAlchemy init."""
        mock_app = MagicMock(spec=Flask)
        with patch('poker_tool.adapters.sqlalchemy.training_sessions.init_sqlalchemy') as mock_init:
            SqlTrainingSessions(mock_app)
            mock_init.assert_called_once_with(mock_app)

    def test_sql_training_sessions_creation_without_app(self):
        """Test creation without app does not initialize the db."""
        with patch('poker_tool.adapters.sqlalchemy.training_sessions.init_sqlalchemy') as mock_init:
            SqlTrainingSessions()
            mock_init.assert_not_called()


if __name__ == '__main__':
    unittest.main()
