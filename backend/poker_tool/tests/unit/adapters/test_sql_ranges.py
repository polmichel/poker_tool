"""
Unit tests for the SqlRanges adapter.
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch
from flask import Flask
from poker_tool.adapters.sqlalchemy.ranges import SqlRanges
from poker_tool.interfaces.ranges import Ranges


class TestSqlRanges(unittest.TestCase):
    """Tests for SqlRanges class."""

    def test_sql_ranges_implements_ranges(self):
        """Test that SqlRanges implements the Ranges interface."""
        self.assertTrue(issubclass(SqlRanges, Ranges))

    def test_sql_ranges_creation(self):
        """Test SqlRanges creation initializes the db."""
        mock_app = MagicMock(spec=Flask)
        with patch('poker_tool.adapters.sqlalchemy.ranges.db') as mock_db:
            ranges = SqlRanges(mock_app)
            mock_db.init_app.assert_called_once_with(mock_app)
            mock_db.create_all.assert_called_once()

    def test_sql_ranges_creation_without_app(self):
        """Test SqlRanges creation without app does not initialize the db."""
        with patch('poker_tool.adapters.sqlalchemy.ranges.db') as mock_db:
            SqlRanges()
            mock_db.init_app.assert_not_called()
            mock_db.create_all.assert_not_called()

    def test_shared_db_initialized_once(self):
        """When multiple Sql* adapters init the same app, db.init_app runs once."""
        mock_app = MagicMock(spec=Flask)
        mock_app._sqlalchemy_initialized = False
        with patch('poker_tool.adapters.sqlalchemy.ranges.db') as mock_db:
            ranges = SqlRanges(mock_app)
            ranges.init_app(mock_app)  # second call should NOT re-init
            self.assertEqual(mock_db.init_app.call_count, 1)


if __name__ == '__main__':
    unittest.main()
