"""
Unit tests for SqlAlchemyStorage adapter.
"""
import unittest
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from unittest.mock import MagicMock, patch
from poker_tool.adapters.sqlalchemy.storage import SqlAlchemyStorage
from poker_tool.interfaces.storage import Storage


class TestSqlAlchemyStorage(unittest.TestCase):
    """Tests for SqlAlchemyStorage class."""

    def test_sqlalchemy_storage_implements_storage(self):
        """Test that SqlAlchemyStorage implements Storage interface."""
        self.assertTrue(issubclass(SqlAlchemyStorage, Storage))

    def test_sqlalchemy_storage_creation(self):
        """Test SqlAlchemyStorage creation."""
        mock_app = MagicMock()
        
        with patch('poker_tool.adapters.sqlalchemy.storage.db') as mock_db:
            storage = SqlAlchemyStorage(mock_app)
            
            # Check that init_app was called
            mock_db.init_app.assert_called_once_with(mock_app)
            mock_db.create_all.assert_called_once()

    def test_sqlalchemy_storage_creation_without_app(self):
        """Test SqlAlchemyStorage creation without app."""
        with patch('poker_tool.adapters.sqlalchemy.storage.db') as mock_db:
            storage = SqlAlchemyStorage()
            
            # Should not call init_app or create_all without app
            mock_db.init_app.assert_not_called()
            mock_db.create_all.assert_not_called()

    def test_init_app(self):
        """Test init_app method."""
        mock_app = MagicMock()
        
        with patch('poker_tool.adapters.sqlalchemy.storage.db') as mock_db:
            storage = SqlAlchemyStorage()
            storage.init_app(mock_app)
            
            mock_db.init_app.assert_called_once_with(mock_app)
            mock_db.create_all.assert_called_once()


if __name__ == '__main__':
    unittest.main()
