"""
Create a range (use case).

Encapsulates: resolving the user (from auth or explicit id) and persisting
the range. Dependencies (Ranges port, Auth port) are injected.
"""
from typing import Optional
from ..interfaces.ranges import Ranges
from ..interfaces.auth import Auth
from ..objects.range import Range


class CreateRange:
    """Create and persist a new range."""

    def __init__(self, ranges: Ranges, auth: Auth) -> None:
        self._ranges = ranges
        self._auth = auth

    def create(self, data: dict) -> Range:
        """Create a range from request data, resolving the user if needed."""
        user_id = data.get("user_id")
        if not user_id:
            current_user = self._auth.current_user()
            if current_user:
                user_id = current_user.id

        range_obj = Range.from_dict({**data, "user_id": user_id})
        return self._ranges.add(range_obj)
