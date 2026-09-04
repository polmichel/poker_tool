"""
Compute statistics for a user (use case).

Encapsulates: validating the user exists and aggregating their sessions and
ranges. Dependencies (Users, Ranges, TrainingSessions ports) are injected.
"""
from ..interfaces.ranges import Ranges
from ..interfaces.training_sessions import TrainingSessions
from ..interfaces.users import Users
from .errors import UserNotFound


class UserStats:
    """Compute aggregated statistics for a specific user."""

    def __init__(self, users: Users, ranges: Ranges, sessions: TrainingSessions) -> None:
        self._users = users
        self._ranges = ranges
        self._sessions = sessions

    def compute(self, user_id: int) -> dict:
        user = self._users.user_by_id(user_id)
        if not user:
            raise UserNotFound(user_id)

        sessions = self._sessions.sessions_by_user(user_id)
        ranges = self._ranges.ranges_by_user(user_id)

        total_sessions = len(sessions)
        avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0.0
        total_time_spent = sum(s.time_spent for s in sessions)
        best_score = max((s.score for s in sessions), default=0.0)
        most_played_range = max(ranges, key=lambda r: len(r.hands)).name if ranges else ""

        return {
            "user_id": user_id,
            "total_sessions": total_sessions,
            "avg_score": round(avg_score, 2),
            "total_time_spent": total_time_spent,
            "best_score": round(best_score, 2),
            "most_played_range": most_played_range,
        }
