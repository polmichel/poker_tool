"""HTTP controllers for the equity resource."""
import re

from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest

from ....interfaces.equity_calculator import (
    EquityCalculator,
    MissingEquityEntry,
)
from ....objects.hand import Hand
from ....objects.range_parser import InvalidRangeNotation, parse_range

_HERO_RE = re.compile(r"^[2-9TJQKA]{2}[soSO]?$")


class EquityController:
    """Thin HTTP controller for /api/equity.

    Two strategies are injected, both behind the :class:`EquityCalculator`
    port:

    * ``table_equity`` \u2014 the exact pre-computed table (default). Raises
      :class:`MissingEquityEntry` when the table cannot answer fully, which the
      controller turns into a **409** listing the missing opponent hands so the
      frontend can prompt the user to run a Monte-Carlo simulation.
    * ``monte_carlo_equity`` \u2014 the Monte-Carlo engine, used only when the
      caller explicitly requests it by sending ``iterations``.

    So a plain "Simulate" click (no ``iterations``) returns the exact, instant,
    reproducible result; if the table is incomplete the user is asked (via the
    frontend pop-up) to provide an iteration count, and the second call runs
    Monte-Carlo. The Monte-Carlo engine is never a silent fallback.
    """

    def __init__(
        self,
        table_equity: EquityCalculator,
        monte_carlo_equity: EquityCalculator,
    ) -> None:
        self._table_equity = table_equity
        self._monte_carlo_equity = monte_carlo_equity

    def register(self, api: Blueprint) -> None:
        @api.route("/equity/simulate", methods=["POST"])
        def simulate_equity():
            data = request.get_json()
            if not data or "hero" not in data:
                raise BadRequest("Missing required field: hero")
            hero_raw = str(data["hero"]).strip().upper()
            if not _HERO_RE.match(hero_raw):
                raise BadRequest(f"Invalid hero hand: {data['hero']}")
            try:
                # Canonicalize to the table's notation (e.g. 'AKS' -> 'AKs') so
                # the exact equity table path can answer instead of falling
                # back to Monte-Carlo.
                hero = str(Hand.from_string(hero_raw))
            except (ValueError, IndexError) as exc:
                raise BadRequest(f"Invalid hero hand: {data['hero']}") from exc

            range_notation = str(data.get("range", "")).strip()
            if not range_notation:
                raise BadRequest("Missing required field: range")
            try:
                range_hands = [str(h) for h in parse_range(range_notation)]
            except InvalidRangeNotation as exc:
                raise BadRequest(str(exc)) from exc
            if not range_hands:
                raise BadRequest("Range contains no hands")

            iterations = data.get("iterations")

            # No iterations requested: use the exact table. If the table is
            # incomplete, return 409 with the missing opponent hands so the
            # frontend can prompt the user to run a Monte-Carlo simulation.
            if iterations is None:
                try:
                    result = self._table_equity.compute(
                        hero=hero, range_hands=range_hands,
                    )
                except MissingEquityEntry as exc:
                    return jsonify({
                        "error": "Equit\u00e9 exacte indisponible pour certaines mains",
                        "missing": exc.missing,
                    }), 409
                return jsonify(result.to_dict()), 200

            # Iterations provided: run Monte-Carlo explicitly.
            iterations = int(iterations)
            if iterations <= 0 or iterations > 100000:
                raise BadRequest("iterations must be between 1 and 100000")
            try:
                result = self._monte_carlo_equity.compute(
                    hero=hero, range_hands=range_hands, iterations=iterations,
                )
            except ValueError as exc:
                raise BadRequest(str(exc)) from exc
            return jsonify(result.to_dict()), 200
