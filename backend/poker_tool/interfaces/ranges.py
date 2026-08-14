"""
Ranges port (Elegant Objects).

A single-responsibility port for reading and writing :class:`Range` objects.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..objects.range import Range


class Ranges(ABC):
    """Abstract port for range persistence."""

    @abstractmethod
    def add(self, range_obj: Range) -> Range:
        """Add a new range (or update an existing one) and return the stored range."""
        pass

    @abstractmethod
    def range_by_id(self, range_id: int) -> Optional[Range]:
        """Find a range by ID, or ``None`` if not found."""
        pass

    @abstractmethod
    def all(self) -> List[Range]:
        """Return all ranges."""
        pass

    @abstractmethod
    def remove(self, range_obj: Range) -> None:
        """Remove a range."""
        pass

    @abstractmethod
    def ranges_by_user(self, user_id: int) -> List[Range]:
        """Return all ranges belonging to a user."""
        pass
