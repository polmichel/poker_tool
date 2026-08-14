"""
Users port (Elegant Objects).

A single-responsibility port for reading and writing :class:`User` objects.
Every method speaks only about users — no generic ``save(obj)``,
no ``isinstance`` dispatch.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..objects.user import User


class Users(ABC):
    """Abstract port for user persistence."""

    @abstractmethod
    def add(self, user: User) -> User:
        """Add a new user (or update an existing one) and return the stored user."""
        pass

    @abstractmethod
    def user_by_id(self, user_id: int) -> Optional[User]:
        """Find a user by ID, or ``None`` if not found."""
        pass

    @abstractmethod
    def user_by_username(self, username: str) -> Optional[User]:
        """Find a user by username, or ``None`` if not found."""
        pass

    @abstractmethod
    def user_by_email(self, email: str) -> Optional[User]:
        """Find a user by email, or ``None`` if not found."""
        pass

    @abstractmethod
    def all(self) -> List[User]:
        """Return all users."""
        pass
