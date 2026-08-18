"""
Monte-Carlo equity calculator adapter (Elegant Objects).

Wraps the existing :class:`SimulateEquity` use case behind the
:class:`EquityCalculator` port so it can be injected interchangeably with the
exact-table strategy. The Monte-Carlo engine itself is left untouched: this
adapter only adapts its interface (adding the default ``iterations`` and the
``compute`` method name expected by the port).

This is the fallback strategy used when the exact table is missing or
incomplete; it is also injectable on its own for future use cases
(postflop, range vs range) where exact enumeration is not tractable.
"""
from ...interfaces.equity_calculator import EquityCalculator
from ...objects.equity import EquityResult
from ...use_cases.simulate_equity import SimulateEquity


class MonteCarloEquityCalculator(EquityCalculator):
    """EquityCalculator backed by the Monte-Carlo SimulateEquity use case."""

    def __init__(self, simulate_equity: SimulateEquity, iterations: int = 10000) -> None:
        self._simulate_equity = simulate_equity
        self._iterations = iterations

    def compute(self, hero: str, range_hands: list[str]) -> EquityResult:
        """Run the Monte-Carlo simulation with the configured iteration count."""
        return self._simulate_equity.simulate(
            hero=hero, range_hands=range_hands, iterations=self._iterations,
        )
