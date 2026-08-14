"""
Compute global statistics (use case).

Encapsulates: aggregating ranges, users and sessions into a global stats
payload. Dependencies (the three ports) are injected.
"""
from ..interfaces.ranges import Ranges
from ..interfaces.training_sessions import TrainingSessions
from ..interfaces.users import Users


class GlobalStats:
    """Compute aggregated statistics across all entities."""

    def __init__(self, ranges: Ranges, users: Users, sessions: TrainingSessions) -> None:
        self._ranges = ranges
        self._users = users
        self._sessions = sessions

    def compute(self) -> dict:
        ranges = self._ranges.all()
        users = self._users.all()
        sessions = self._sessions.all()

        total_hands = sum(len(r.hands) for r in ranges)
        total_sessions = len(sessions)
        avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0.0

        action_counts = {}
        for r in ranges:
            for action in r.hands.values():
                action_name = action.type.name
                action_counts[action_name] = action_counts.get(action_name, 0) + 1
        most_common_action = (
            max(action_counts.items(), key=lambda x: x[1])[0] if action_counts else "UNDEFINED"
        )

        return {
            "total_ranges": len(ranges),
            "total_users": len(users),
            "total_sessions": total_sessions,
            "total_hands": total_hands,
            "avg_score": round(avg_score, 2),
            "most_common_action": most_common_action,
        }
