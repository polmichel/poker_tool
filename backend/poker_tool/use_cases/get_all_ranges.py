"""
Get all ranges (use case).

Encapsulates: fetching all ranges from the persistence layer.
Dependencies (Ranges port) are injected.
"""
from ..interfaces.ranges import Ranges
from ..objects.range import Range


class GetAllRanges:
    """Fetch all ranges from persistence."""

    def __init__(self, ranges: Ranges) -> None:
        self._ranges = ranges

    def get(self) -> list[Range]:
        """Return all ranges."""
        return self._ranges.all()
