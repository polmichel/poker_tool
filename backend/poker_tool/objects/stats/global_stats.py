"""
Immutable global stats value object (Elegant Objects).
"""
from typing import Dict


class GlobalStats:
    """Immutable global statistics value object."""

    def __init__(
        self,
        total_ranges: int = 0,
        total_users: int = 0,
        total_sessions: int = 0,
        avg_score: float = 0.0,
        most_common_action: str = "undefined",
    ):
        self._total_ranges = total_ranges
        self._total_users = total_users
        self._total_sessions = total_sessions
        self._avg_score = avg_score
        self._most_common_action = most_common_action

    @property
    def total_ranges(self) -> int:
        """Total number of ranges."""
        return self._total_ranges

    @property
    def total_users(self) -> int:
        """Total number of users."""
        return self._total_users

    @property
    def total_sessions(self) -> int:
        """Total number of training sessions."""
        return self._total_sessions

    @property
    def avg_score(self) -> float:
        """Average score across all sessions."""
        return self._avg_score

    @property
    def most_common_action(self) -> str:
        """Most common action in ranges."""
        return self._most_common_action

    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            "total_ranges": self._total_ranges,
            "total_users": self._total_users,
            "total_sessions": self._total_sessions,
            "avg_score": round(self._avg_score, 2),
            "most_common_action": self._most_common_action,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'GlobalStats':
        """Create from dictionary."""
        return cls(
            total_ranges=data.get("total_ranges", 0),
            total_users=data.get("total_users", 0),
            total_sessions=data.get("total_sessions", 0),
            avg_score=data.get("avg_score", 0.0),
            most_common_action=data.get("most_common_action", "undefined"),
        )

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, GlobalStats):
            return False
        return (
            self._total_ranges == other._total_ranges and
            self._total_users == other._total_users and
            self._total_sessions == other._total_sessions and
            self._avg_score == other._avg_score and
            self._most_common_action == other._most_common_action
        )

    def __hash__(self) -> int:
        """Hash for use in sets/dicts."""
        return hash((
            self._total_ranges,
            self._total_users,
            self._total_sessions,
            self._avg_score,
            self._most_common_action,
        ))
