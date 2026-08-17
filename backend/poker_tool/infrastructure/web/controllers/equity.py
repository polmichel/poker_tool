"""HTTP controllers for the equity resource."""
import re

from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest

from ....objects.hand import Hand
from ....objects.range_parser import InvalidRangeNotation, parse_range
from ....use_cases.simulate_equity import SimulateEquity


_HERO_RE = re.compile(r"^[2-9TJQKA]{2}[soSO]?$")


class EquityController:
    """Thin HTTP controller for /api/equity."""

    def __init__(self, simulate_equity: SimulateEquity) -> None:
        self._simulate_equity = simulate_equity

    def register(self, api: Blueprint) -> None:
        @api.route("/equity/simulate", methods=["POST"])
        def simulate_equity():
            data = request.get_json()
            if not data or "hero" not in data:
                raise BadRequest("Missing required field: hero")
            hero = str(data["hero"]).strip().upper()
            if not _HERO_RE.match(hero):
                raise BadRequest(f"Invalid hero hand: {data['hero']}")
            try:
                Hand.from_string(hero)
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

            try:
                result = self._simulate_equity.simulate(
                    hero=hero,
                    range_hands=range_hands,
                    iterations=iterations,
                )
            except ValueError as exc:
                raise BadRequest(str(exc)) from exc

            return jsonify(result.to_dict()), 200
