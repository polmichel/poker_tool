"""
Start a training session (use case).

Encapsulates: fetching the range, validating it has hands, resolving the
user (explicit, auth, or fallback) and creating + persisting the session.
Dependencies (Ranges port, Users port, TrainingSessions port, Auth port) are
injected.
"""
from ..interfaces.ranges import Ranges
from ..interfaces.users import Users
from ..interfaces.training_sessions import TrainingSessions
from ..interfaces.auth import Auth
from ..objects.training.session import TrainingSession


class RangeNotFound(Exception):
    """Raised when the range does not exist."""


class RangeHasNoHands(Exception):
    """Raised when the range has no hands to train on."""


class UserRequired(Exception):
    """Raised when no user can be resolved for the session."""


class StartedSession:
    """Result of starting a session: the persisted session."""

    def __init__(self, session: TrainingSession) -> None:
        self.session = session


class StartTrainingSession:
    """Create and persist a new training session."""

    def __init__(
        self,
        ranges: Ranges,
        users: Users,
        sessions: TrainingSessions,
        auth: Auth,
    ) -> None:
        self._ranges = ranges
        self._users = users
        self._sessions = sessions
        self._auth = auth

    def start(self, mode: str, range_id: int, total_questions: int = 10, user_id=None) -> StartedSession:
        range_obj = self._ranges.range_by_id(range_id)
        if not range_obj:
            raise RangeNotFound(f"Range {range_id} not found")
        if not range_obj.hands or len(range_obj.hands) == 0:
            raise RangeHasNoHands(
                f"Range {range_id} has no hands. Please add hands to your range "
                f"before starting a training session."
            )

        user = self._resolve_user(user_id)
        if not user:
            raise UserRequired("User required")

        session = TrainingSession(
            user=user,
            range_obj=range_obj,
            mode=mode,
            total_questions=total_questions,
        )
        saved = self._sessions.add(session)
        return StartedSession(saved)

    def _resolve_user(self, user_id):
        if user_id:
            return self._users.user_by_id(user_id)
        current = self._auth.current_user()
        if current and current.id:
            return self._users.user_by_id(current.id)
        users = self._users.all()
        return users[0] if users else None
