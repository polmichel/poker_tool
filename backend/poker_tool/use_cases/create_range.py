"""
Create a range (use case).

Encapsulates: resolving the user (from auth or explicit id) and persisting
the range. Dependencies (Ranges port, ResolveUser use case) are injected.
"""
from ..interfaces.ranges import Ranges
from ..objects.range import Range
from .resolve_user import ResolveUser


class CreateRange:
    """Create and persist a new range."""

    def __init__(self, ranges: Ranges, resolve_user: ResolveUser) -> None:
        self._ranges = ranges
        self._resolve_user = resolve_user

    def create(self, data: dict) -> Range:
        """Create a range from request data, resolving the user if needed."""
        user_id = data.get("user_id")
        if not user_id:
            user = self._resolve_user.resolve()
            user_id = user.id if user else None

        range_obj = Range.from_dict({**data, "user_id": user_id})
        return self._ranges.add(range_obj)
