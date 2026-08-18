"""Auth interface (Port) for Poker Tool."""
from abc import ABC, abstractmethod

from ..objects.user import User


class Auth(ABC):
    """Abstract authentication interface."""

    @abstractmethod
    def create_user(self, username: str, email: str, password: str) -> User:
        """Create a new user."""

    @abstractmethod
    def current_user(self) -> User | None:
        """Get the current authenticated user."""

    @abstractmethod
    def generate_token(self, user: User) -> str:
        """Generate an authentication token for a user."""
