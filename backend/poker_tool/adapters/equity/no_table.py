"""
No-table equity calculator adapter (Elegant Objects).

Used when the pre-computed exact equity table file is absent: every request to
the exact path returns a :class:`MissingEquityEntry` so the HTTP layer returns
a 409 and the frontend prompts the user to run a Monte-Carlo simulation. This
keeps the application startable without the table while never silently
producing a high-variance estimate from the exact endpoint.
"""
from ...interfaces.equity_calculator import (
    EquityCalculator,
    MissingEquityEntry,
)
from ...objects.equity import EquityResult


class NoTableEquityCalculator(EquityCalculator):
    """EquityCalculator that always signals a missing exact table."""

    def __init__(self, message: str = "La table d'\u00e9quit\u00e9 exacte n'est pas g\u00e9n\u00e9r\u00e9e") -> None:
        self._message = message

    def compute(
        self, hero: str, range_hands: list[str], iterations: int | None = None,
    ) -> EquityResult:
        raise MissingEquityEntry(range_hands, message=self._message)
