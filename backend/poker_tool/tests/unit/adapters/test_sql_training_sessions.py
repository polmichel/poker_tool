"""
Unit tests for the SqlTrainingSessions adapter.
"""
import unittest
import sys
import os

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
        """Test SqlTrainingSessions creation initializes the db."""
        mock_app = MagicMock(spec=Flask)
        with patch('poker_tool.adapters.sqlalchemy.training_sessions.db') as mock_db:
            sessions = SqlTrainingSessions(mock_app)
            mock_db.init_app.assert_called_once_with(mock_app)
            mock_db.create_all.assert_called_once()

    def test_sql_training_sessions_creation_without_app(self):
        """Test creation without app does not initialize the db."""
        with patch('poker_tool.adapters.sqlalchemy.training_sessions.db') as mock_db:
            SqlTrainingSessions()
            mock_db.init_app.assert_not_called()
            mock_db.create_all.assert_not_called()


if __name__ == '__main__':
    unittest.main()
