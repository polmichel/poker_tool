"""
Unit tests for the SqlUsers adapter.
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch
from flask import Flask
from poker_tool.adapters.sqlalchemy.users import SqlUsers
from poker_tool.interfaces.users import Users


class TestSqlUsers(unittest.TestCase):
    """Tests for SqlUsers class."""

    def test_sql_users_implements_users(self):
        """Test that SqlUsers implements the Users interface."""
        self.assertTrue(issubclass(SqlUsers, Users))

    def test_sql_users_creation(self):
        """Test SqlUsers creation initializes the db."""
        mock_app = MagicMock(spec=Flask)
        with patch('poker_tool.adapters.sqlalchemy.users.db') as mock_db:
            users = SqlUsers(mock_app)
            mock_db.init_app.assert_called_once_with(mock_app)
            mock_db.create_all.assert_called_once()

    def test_sql_users_creation_without_app(self):
        """Test SqlUsers creation without app does not initialize the db."""
        with patch('poker_tool.adapters.sqlalchemy.users.db') as mock_db:
            SqlUsers()
            mock_db.init_app.assert_not_called()
            mock_db.create_all.assert_not_called()


if __name__ == '__main__':
    unittest.main()
