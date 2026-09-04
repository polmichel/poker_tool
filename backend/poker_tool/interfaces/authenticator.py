"""
Authenticator port (Elegant Objects).

A single-responsibility port for authentication operations: token generation
and password verification. This separates authentication concerns from user
creation and persistence.
"""
from abc import ABC, abstractmethod

from ..objects.user import User


class Authenticator(ABC):
    """Abstract port for authentication operations."""

    @abstractmethod
    def generate_token(self, user: User) -> str:
        """Generate an authentication token for a user.
        
        Args:
            user: The user to generate a token for.
        
        Returns:
            A JWT or other authentication token string.
        """

    @abstractmethod
    def check_password(self, password: str, password_hash: str) -> bool:
        """Check if a plaintext password matches its hash.
        
        Args:
            password: The plaintext password to check.
            password_hash: The stored password hash.
        
        Returns:
            True if the password matches the hash, False otherwise.
        """
