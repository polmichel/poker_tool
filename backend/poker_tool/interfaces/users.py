"""
Users port (Elegant Objects).

A single-responsibility port for reading and writing :class:`User` objects.
Every method speaks only about users — no generic ``save(obj)``,
no ``isinstance`` dispatch.
"""
from abc import ABC, abstractmethod

from ..objects.user import User


class Users(ABC):
    """Abstract port for user persistence."""

    @abstractmethod
    def add(self, user: User) -> User:
        """Add a new user (or update an existing one) and return the stored user."""

    @abstractmethod
    def user_by_id(self, user_id: int) -> User | None:
        """Find a user by ID, or ``None`` if not found."""

    @abstractmethod
    def user_by_username(self, username: str) -> User | None:
        """Find a user by username, or ``None`` if not found."""

    @abstractmethod
    def user_by_email(self, email: str) -> User | None:
        """Find a user by email, or ``None`` if not found."""

    @abstractmethod
    def all(self) -> list[User]:
        """Return all users."""
