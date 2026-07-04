"""
Storage interface (Port) for Poker Tool.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..objects.range import Range
from ..objects.user import User
from ..objects.training.session import TrainingSession


class Storage(ABC):
    """Abstract storage interface."""

    @abstractmethod
    def save(self, obj: object) -> object:
        """Save an object."""
        pass

    @abstractmethod
    def get(self, obj_type: type, obj_id: int) -> Optional[object]:
        """Get an object by ID."""
        pass

    @abstractmethod
    def all(self, obj_type: type) -> List[object]:
        """Get all objects of a type."""
        pass

    @abstractmethod
    def remove(self, obj: object) -> None:
        """Remove an object."""
        pass

    # Specific methods for Range
    @abstractmethod
    def ranges_by_user(self, user_id: int) -> List[Range]:
        """Get all ranges for a user."""
        pass

    # Specific methods for TrainingSession
    @abstractmethod
    def sessions_by_user(self, user_id: int) -> List[TrainingSession]:
        """Get all training sessions for a user."""
        pass

    # Specific methods for User
    @abstractmethod
    def user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        pass

    @abstractmethod
    def user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        pass
