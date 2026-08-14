"""
Training sessions port (Elegant Objects).

A single-responsibility port for reading and writing
:class:`TrainingSession` objects.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..objects.training.session import TrainingSession


class TrainingSessions(ABC):
    """Abstract port for training session persistence."""

    @abstractmethod
    def add(self, session: TrainingSession) -> TrainingSession:
        """Add a new session (or update an existing one) and return the stored session."""
        pass

    @abstractmethod
    def session_by_id(self, session_id: int) -> Optional[TrainingSession]:
        """Find a session by ID, or ``None`` if not found."""
        pass

    @abstractmethod
    def all(self) -> List[TrainingSession]:
        """Return all training sessions."""
        pass

    @abstractmethod
    def sessions_by_user(self, user_id: int) -> List[TrainingSession]:
        """Return all training sessions belonging to a user."""
        pass
