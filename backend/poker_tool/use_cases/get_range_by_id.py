"""
Get a range by ID (use case).

Encapsulates: fetching a single range by its ID from the persistence layer.
Dependencies (Ranges port) are injected.
"""
from ..interfaces.ranges import Ranges
from ..objects.range import Range
from .errors import RangeNotFound


class GetRangeById:
    """Fetch a range by its ID."""

    def __init__(self, ranges: Ranges) -> None:
        self._ranges = ranges

    def get(self, range_id: int) -> Range:
        """Return the range with the given ID.
        
        Raises:
            RangeNotFound: If no range exists with the given ID.
        """
        range_obj = self._ranges.range_by_id(range_id)
        if not range_obj:
            raise RangeNotFound(range_id)
        return range_obj
