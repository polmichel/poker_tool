"""
Auth interface (Port) for Poker Tool.

This is the legacy combined interface. For new code, prefer using the
separated interfaces:
- UserFactory for user creation
- Authenticator for token generation and password checking
- CurrentUserResolver for resolving the current user

This interface is kept for backward compatibility with existing code.
"""
from abc import abstractmethod

from ..objects.user import User
from .authenticator import Authenticator
from .current_user_resolver import CurrentUserResolver
from .user_factory import UserFactory


class Auth(UserFactory, Authenticator, CurrentUserResolver):
    """Abstract authentication interface (legacy combined interface).

    This combines UserFactory, Authenticator, and CurrentUserResolver for
    backward compatibility. New code should prefer the separated interfaces.
    """

    @abstractmethod
    def create_user(self, username: str, email: str, password: str) -> User:
        """Create a new user."""

    @abstractmethod
    def current_user(self) -> User | None:
        """Get the current authenticated user."""

    @abstractmethod
    def generate_token(self, user: User) -> str:
        """Generate an authentication token for a user."""
