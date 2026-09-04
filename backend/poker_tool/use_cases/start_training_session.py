"""
Start a training session (use case).

Encapsulates: fetching the range, validating it has hands, resolving the
user (explicit, auth, or fallback) and creating + persisting the session.
Dependencies (Ranges port, TrainingSessions port, ResolveUser use case) are
injected.
"""
from ..interfaces.ranges import Ranges
from ..interfaces.training_sessions import TrainingSessions
from ..objects.training.session import TrainingSession
from .errors import RangeHasNoHands, RangeNotFound
from .resolve_user import ResolveUser


class StartedSession:
    """Result of starting a session: the persisted session."""

    def __init__(self, session: TrainingSession) -> None:
        self.session = session


class StartTrainingSession:
    """Create and persist a new training session."""

    def __init__(
        self,
        ranges: Ranges,
        sessions: TrainingSessions,
        resolve_user: ResolveUser,
    ) -> None:
        self._ranges = ranges
        self._sessions = sessions
        self._resolve_user = resolve_user

    def start(self, mode: str, range_id: int, total_questions: int = 10, user_id: int | None = None) -> StartedSession:
        range_obj = self._ranges.range_by_id(range_id)
        if not range_obj:
            raise RangeNotFound(range_id)
        if not range_obj.hands or len(range_obj.hands) == 0:
            raise RangeHasNoHands(
                f"Range {range_id} has no hands. Please add hands to your range "
                f"before starting a training session."
            )

        user = self._resolve_user.resolve_or_raise(user_id)

        # In "guess" mode the user must identify a displayed grid among the
        # ranges of the library, so the session needs the whole library.
        library_ranges = self._ranges.all() if mode == "guess" else None

        session = TrainingSession(
            user=user,
            range_obj=range_obj,
            mode=mode,
            total_questions=total_questions,
            library_ranges=library_ranges,
        )
        saved = self._sessions.add(session)
        return StartedSession(saved)
