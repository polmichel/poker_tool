"""
Get ranges by user (use case).

Encapsulates: fetching all ranges belonging to a specific user.
Dependencies (Ranges port) are injected.
"""
from ..interfaces.ranges import Ranges
from ..objects.range import Range


class GetRangesByUser:
    """Fetch all ranges belonging to a user."""

    def __init__(self, ranges: Ranges) -> None:
        self._ranges = ranges

    def get(self, user_id: int) -> list[Range]:
        """Return all ranges belonging to the user with the given ID."""
        return self._ranges.ranges_by_user(user_id)
