"""
Immutable user stats value object (Elegant Objects).
"""
from typing import Dict


class UserStats:
    """Immutable user statistics value object."""

    def __init__(
        self,
        user_id: int,
        total_sessions: int = 0,
        avg_score: float = 0.0,
        total_time_spent: int = 0,
        best_score: float = 0.0,
        most_played_range: str = "",
    ):
        self._user_id = user_id
        self._total_sessions = total_sessions
        self._avg_score = avg_score
        self._total_time_spent = total_time_spent
        self._best_score = best_score
        self._most_played_range = most_played_range

    @property
    def user_id(self) -> int:
        """User ID."""
        return self._user_id

    @property
    def total_sessions(self) -> int:
        """Total number of sessions for this user."""
        return self._total_sessions

    @property
    def avg_score(self) -> float:
        """Average score for this user."""
        return self._avg_score

    @property
    def total_time_spent(self) -> int:
        """Total time spent in seconds."""
        return self._total_time_spent

    @property
    def best_score(self) -> float:
        """Best score achieved."""
        return self._best_score

    @property
    def most_played_range(self) -> str:
        """Most played range name."""
        return self._most_played_range

    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            "user_id": self._user_id,
            "total_sessions": self._total_sessions,
            "avg_score": round(self._avg_score, 2),
            "total_time_spent": self._total_time_spent,
            "best_score": round(self._best_score, 2),
            "most_played_range": self._most_played_range,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'UserStats':
        """Create from dictionary."""
        return cls(
            user_id=data.get("user_id", 0),
            total_sessions=data.get("total_sessions", 0),
            avg_score=data.get("avg_score", 0.0),
            total_time_spent=data.get("total_time_spent", 0),
            best_score=data.get("best_score", 0.0),
            most_played_range=data.get("most_played_range", ""),
        )

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, UserStats):
            return False
        return (
            self._user_id == other._user_id and
            self._total_sessions == other._total_sessions and
            self._avg_score == other._avg_score and
            self._total_time_spent == other._total_time_spent and
            self._best_score == other._best_score and
            self._most_played_range == other._most_played_range
        )

    def __hash__(self) -> int:
        """Hash for use in sets/dicts."""
        return hash((
            self._user_id,
            self._total_sessions,
            self._avg_score,
            self._total_time_spent,
            self._best_score,
            self._most_played_range,
        ))
