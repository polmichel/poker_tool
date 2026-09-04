"""
Current user resolver port (Elegant Objects).

A single-responsibility port for resolving the currently authenticated user
from the request context (e.g., JWT token). This separates the concern of
"who is the current user" from user creation, authentication, and persistence.
"""
from abc import ABC, abstractmethod

from ..objects.user import User


class CurrentUserResolver(ABC):
    """Abstract port for resolving the current authenticated user."""

    @abstractmethod
    def current_user(self) -> User | None:
        """Get the currently authenticated user from the request context.
        
        Returns:
            The User entity for the currently authenticated user, or None
            if no user is authenticated.
        """
