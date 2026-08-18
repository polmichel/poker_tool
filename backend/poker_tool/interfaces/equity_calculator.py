"""
Equity calculator port (Elegant Objects).

A single-responsibility port for computing the equity of a hero hand against
an opposing range. Concrete implementations decide *how* the equity is
computed (exact table lookup, Monte-Carlo sampling, or a hybrid with
fallback), so the controller and the rest of the app depend on this
abstraction rather than on any specific engine.

``hero`` is a canonical hand notation (e.g. 'AKs') and ``range_hands`` is the
already-expanded list of canonical opponent hand notations. The output is an
:class:`EquityResult` (the same value object used by every equity path), so
swapping strategies never changes the API contract.
"""
from abc import ABC, abstractmethod

from ..objects.equity import EquityResult


class EquityCalculator(ABC):
    """Abstract port for computing hero-vs-range equity."""

    @abstractmethod
    def compute(self, hero: str, range_hands: list[str]) -> EquityResult:
        """Return the equity of ``hero`` against the expanded ``range_hands``.

        Implementations are free to read a pre-computed table, run a Monte-Carlo
        simulation, or combine both. The returned :class:`EquityResult` is the
        single contract every caller relies on.
        """
