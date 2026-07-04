"""
Unit tests for User entity.
"""
import unittest
from poker_tool.objects.user import User


class TestUser(unittest.TestCase):
    """Tests for User class."""

    def test_user_creation(self):
        """Test User creation."""
        user = User("testuser", "test@example.com", "hashed_password", 1)
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.password_hash, "hashed_password")
        self.assertEqual(user.id, 1)

    def test_user_creation_minimal(self):
        """Test User creation with minimal parameters."""
        user = User("testuser", "test@example.com")
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertIsNone(user.password_hash)
        self.assertIsNone(user.id)

    def test_user_equality(self):
        """Test equality comparison."""
        user1 = User("testuser", "test@example.com", user_id=1)
        user2 = User("testuser", "test@example.com", user_id=1)
        user3 = User("otheruser", "other@example.com", user_id=2)
        
        self.assertEqual(user1, user2)
        self.assertNotEqual(user1, user3)
        self.assertNotEqual(user1, "not a user")

    def test_user_hash(self):
        """Test hash for use in sets/dicts."""
        user1 = User("testuser", "test@example.com", user_id=1)
        user2 = User("testuser", "test@example.com", user_id=1)
        
        # Should be able to use in sets
        user_set = {user1, user2}
        self.assertEqual(len(user_set), 1)

    def test_user_to_dict(self):
        """Test serialization to dictionary."""
        user = User("testuser", "test@example.com", "hashed_password", 1)
        user_dict = user.to_dict()
        
        self.assertEqual(user_dict["id"], 1)
        self.assertEqual(user_dict["username"], "testuser")
        self.assertEqual(user_dict["email"], "test@example.com")
        self.assertNotIn("password_hash", user_dict)

    def test_user_from_dict(self):
        """Test creation from dictionary."""
        data = {
            "id": 1,
            "username": "testuser",
            "email": "test@example.com",
            "password_hash": "hashed_password",
        }
        user = User.from_dict(data)
        
        self.assertEqual(user.id, 1)
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.password_hash, "hashed_password")

    def test_user_from_dict_minimal(self):
        """Test creation from dictionary with minimal data."""
        data = {"username": "testuser", "email": "test@example.com"}
        user = User.from_dict(data)
        
        self.assertIsNone(user.id)
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertIsNone(user.password_hash)


if __name__ == '__main__':
    unittest.main()
