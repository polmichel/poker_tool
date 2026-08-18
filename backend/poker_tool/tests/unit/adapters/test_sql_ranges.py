"""
Unit tests for the SqlRanges adapter.
"""
import os
import sys
import unittest

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch

from flask import Flask

from poker_tool.adapters.sqlalchemy import init_sqlalchemy
from poker_tool.adapters.sqlalchemy.ranges import SqlRanges
from poker_tool.interfaces.ranges import Ranges


class TestSqlRanges(unittest.TestCase):
    """Tests for SqlRanges class."""

    def test_sql_ranges_implements_ranges(self):
        """Test that SqlRanges implements the Ranges interface."""
        self.assertTrue(issubclass(SqlRanges, Ranges))

    def test_sql_ranges_creation(self):
        """Test SqlRanges creation delegates to the shared SQLAlchemy init."""
        mock_app = MagicMock(spec=Flask)
        with patch('poker_tool.adapters.sqlalchemy.ranges.init_sqlalchemy') as mock_init:
            SqlRanges(mock_app)
            mock_init.assert_called_once_with(mock_app)

    def test_sql_ranges_creation_without_app(self):
        """Test SqlRanges creation without app does not initialize the db."""
        with patch('poker_tool.adapters.sqlalchemy.ranges.init_sqlalchemy') as mock_init:
            SqlRanges()
            mock_init.assert_not_called()

    def test_shared_db_initialized_once(self):
        """When init_sqlalchemy is called twice on the same app, db.init_app runs once."""
        mock_app = MagicMock(spec=Flask)
        mock_app._sqlalchemy_initialized = False
        with patch('poker_tool.adapters.sqlalchemy.db') as mock_db:
            init_sqlalchemy(mock_app)  # first call initializes
            init_sqlalchemy(mock_app)  # second call is a no-op (flag set)
            self.assertEqual(mock_db.init_app.call_count, 1)


if __name__ == '__main__':
    unittest.main()
