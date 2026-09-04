"""HTTP controllers for the stats resource."""
import logging

from flask import Blueprint, jsonify
from werkzeug.exceptions import NotFound

from ....use_cases.errors import UserNotFound
from ....use_cases.global_stats import GlobalStats
from ....use_cases.user_stats import UserStats

logger = logging.getLogger(__name__)


class StatsController:
    """Thin HTTP controller for /api/stats."""

    def __init__(self, global_stats: GlobalStats, user_stats: UserStats) -> None:
        self._global_stats = global_stats
        self._user_stats = user_stats

    def register(self, api: Blueprint) -> None:
        @api.route("/stats/global", methods=["GET"])
        def get_global_stats():
            try:
                return jsonify(self._global_stats.compute())
            except Exception:
                logger.exception("Failed to compute global stats")
                return jsonify({"error": "Erreur lors du chargement des statistiques globales"}), 500

        @api.route("/stats/user/<int:user_id>", methods=["GET"])
        def get_user_stats(user_id: int):
            try:
                return jsonify(self._user_stats.compute(user_id))
            except UserNotFound:
                raise NotFound(f"User {user_id} not found")
            except Exception:
                logger.exception("Failed to compute stats for user %s", user_id)
                return (
                    jsonify({"error": f"Erreur lors du chargement des statistiques de l'utilisateur {user_id}"}),
                    500,
                )
