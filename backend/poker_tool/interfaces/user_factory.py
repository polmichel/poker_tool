"""
User factory port (Elegant Objects).

A single-responsibility port for creating user entities. This separates
user creation logic from authentication and persistence concerns.
"""
from abc import ABC, abstractmethod

from ..objects.user import User


class UserFactory(ABC):
    """Abstract port for creating user entities."""

    @abstractmethod
    def create_user(self, username: str, email: str, password: str) -> User:
        """Create a new user entity with hashed password.

        Args:
            username: The username for the new user.
            email: The email address for the new user.
            password: The plaintext password to hash and store.

        Returns:
            A new User entity with the password hash set.
        """
