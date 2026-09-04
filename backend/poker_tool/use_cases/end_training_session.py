"""
End a training session (use case).

Encapsulates: fetching the session, ending it (immutable) and persisting the
result. Dependencies (TrainingSessions port) are injected.
"""
from ..interfaces.training_sessions import TrainingSessions
from ..objects.training.session import TrainingSession
from .errors import SessionNotFound


class EndedSession:
    """Result of ending a session: the persisted, ended session."""

    def __init__(self, session: TrainingSession) -> None:
        self.session = session


class EndTrainingSession:
    """End an in-progress training session."""

    def __init__(self, sessions: TrainingSessions) -> None:
        self._sessions = sessions

    def end(self, session_id: int) -> EndedSession:
        session = self._sessions.session_by_id(session_id)
        if not session:
            raise SessionNotFound(f"Session {session_id} not found")
        ended = session.end()
        saved = self._sessions.add(ended)
        return EndedSession(saved)
