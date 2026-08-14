"""HTTP controllers for the stats resource."""
from flask import Blueprint, jsonify
from werkzeug.exceptions import NotFound
from ....use_cases.global_stats import GlobalStats
from ....use_cases.user_stats import UserStats, UserNotFound


class StatsController:
    """Thin HTTP controller for /api/stats."""

    def __init__(self, global_stats: GlobalStats, user_stats: UserStats) -> None:
        self._global_stats = global_stats
        self._user_stats = user_stats

    def register(self, api: Blueprint) -> None:
        @api.route("/stats/global", methods=["GET"])
        def get_global_stats():
            return jsonify(self._global_stats.compute())

        @api.route("/stats/user/<int:user_id>", methods=["GET"])
        def get_user_stats(user_id: int):
            try:
                return jsonify(self._user_stats.compute(user_id))
            except UserNotFound:
                raise NotFound(f"User {user_id} not found")
