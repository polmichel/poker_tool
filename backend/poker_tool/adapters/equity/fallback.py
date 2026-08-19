"""
Fallback equity calculator (Elegant Objects).

Composite :class:`EquityCalculator` that tries an exact strategy (default: the
pre-computed table) and falls back to a backup strategy (default:
Monte-Carlo) when the primary cannot answer.

This keeps the Monte-Carlo engine as the safety net the user asked for: the app
gets exact, reproducible equity by default from the table, but if an entry is
missing or the table file is absent, it transparently degrades to
Monte-Carlo instead of erroring.
"""
from ...interfaces.equity_calculator import EquityCalculator
from ...objects.equity import EquityResult


class ExactWithMonteCarloFallback(EquityCalculator):
    """Try ``primary`` (exact) first, fall back to ``fallback`` (Monte-Carlo)."""

    def __init__(self, primary: EquityCalculator, fallback: EquityCalculator) -> None:
        self._primary = primary
        self._fallback = fallback

    def compute(
        self, hero: str, range_hands: list[str], iterations: int | None = None,
    ) -> EquityResult:
        """Return primary result; on a missing entry, return the fallback result."""
        try:
            return self._primary.compute(hero, range_hands, iterations)
        except (ValueError, FileNotFoundError):
            return self._fallback.compute(hero, range_hands, iterations)
