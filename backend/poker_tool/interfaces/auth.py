"""
Auth interface (Port) for Poker Tool.
"""
from abc import ABC, abstractmethod
from typing import Optional
from ..objects.user import User


class Auth(ABC):
    """Abstract authentication interface."""

    @abstractmethod
    def create_user(self, username: str, email: str, password: str) -> User:
        """Create a new user."""
        pass

    @abstractmethod
    def authenticate(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user."""
        pass

    @abstractmethod
    def current_user(self) -> Optional[User]:
        """Get the current authenticated user."""
        pass

    @abstractmethod
    def generate_token(self, user: User) -> str:
        """Generate an authentication token for a user."""
        pass

    @abstractmethod
    def verify_token(self, token: str) -> Optional[User]:
        """Verify an authentication token and return the user."""
        pass
