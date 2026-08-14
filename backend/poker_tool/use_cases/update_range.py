"""
Update a range (use case).

Encapsulates: fetching the existing range, merging the new data into an
immutable updated instance and persisting it. Dependencies (Ranges port) are
injected.
"""
from ..interfaces.ranges import Ranges
from ..objects.range import Range


class RangeNotFound(Exception):
    """Raised when the range to update does not exist."""


class UpdateRange:
    """Update an existing range with new data."""

    def __init__(self, ranges: Ranges) -> None:
        self._ranges = ranges

    def update(self, range_id: int, data: dict) -> Range:
        existing = self._ranges.range_by_id(range_id)
        if not existing:
            raise RangeNotFound(f"Range {range_id} not found")
        updated = Range.from_dict({**existing.to_dict(), **data})
        return self._ranges.add(updated)
