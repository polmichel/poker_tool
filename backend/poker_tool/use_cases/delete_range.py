"""
Delete a range (use case).

Encapsulates: removing a range from the persistence layer.
Dependencies (Ranges port) are injected.
"""
from ..interfaces.ranges import Ranges
from ..objects.range import Range


class DeleteRange:
    """Remove a range from persistence."""

    def __init__(self, ranges: Ranges) -> None:
        self._ranges = ranges

    def delete(self, range_obj: Range) -> None:
        """Remove the given range from persistence."""
        self._ranges.remove(range_obj)
