"""HTTP controllers for the equity resource."""
import re

from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest

from ....interfaces.equity_calculator import EquityCalculator
from ....objects.hand import Hand
from ....objects.range_parser import InvalidRangeNotation, parse_range

_HERO_RE = re.compile(r"^[2-9TJQKA]{2}[soSO]?$")


class EquityController:
    """Thin HTTP controller for /api/equity.

    Depends only on the :class:`EquityCalculator` port; the chosen strategy
    (exact table by default, with a Monte-Carlo fallback) is composed at the
    application root, not here, so the controller stays free of equity logic.
    The ``iterations`` request field still lets callers hint at the Monte-Carlo
    sample count, used when the exact table cannot answer.
    """

    def __init__(self, equity_calculator: EquityCalculator) -> None:
        self._equity_calculator = equity_calculator

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

            iterations = int(data.get("iterations", 10000))
            if iterations <= 0 or iterations > 100000:
                raise BadRequest("iterations must be between 1 and 100000")

            # The injected EquityCalculator decides the strategy: exact table
            # by default, transparently falling back to Monte-Carlo if an
            # entry is missing or the table file is absent.
            try:
                result = self._equity_calculator.compute(
                    hero=hero, range_hands=range_hands,
                )
            except ValueError as exc:
                raise BadRequest(str(exc)) from exc
            return jsonify(result.to_dict()), 200
