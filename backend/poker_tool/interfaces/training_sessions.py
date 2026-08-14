"""
Training sessions port (Elegant Objects).

A single-responsibility port for reading and writing
:class:`TrainingSession` objects.
"""
from abc import ABC, abstractmethod

from ..objects.training.session import TrainingSession


class TrainingSessions(ABC):
    """Abstract port for training session persistence."""

    @abstractmethod
    def add(self, session: TrainingSession) -> TrainingSession:
        """Add a new session (or update an existing one) and return the stored session."""

    @abstractmethod
    def session_by_id(self, session_id: int) -> TrainingSession | None:
        """Find a session by ID, or ``None`` if not found."""

    @abstractmethod
    def all(self) -> list[TrainingSession]:
        """Return all training sessions."""

    @abstractmethod
    def sessions_by_user(self, user_id: int) -> list[TrainingSession]:
        """Return all training sessions belonging to a user."""
