"""
Answer a training question (use case).

Encapsulates: fetching the session, submitting the answer (immutable),
persisting the new session and computing the response payload. Dependencies
(TrainingSessions port) are injected.
"""
from ..interfaces.training_sessions import TrainingSessions
from ..objects.training.session import TrainingSession
from .training_errors import SessionNotFound


class AnsweredQuestion:
    """Result of answering: the new session and the response payload."""

    def __init__(self, session: TrainingSession, response: dict) -> None:
        self.session = session
        self.response = response


class AnswerQuestion:
    """Submit an answer and return the next question (or completion)."""

    def __init__(self, sessions: TrainingSessions) -> None:
        self._sessions = sessions

    def answer(self, session_id: int, answer: str) -> AnsweredQuestion:
        session = self._sessions.session_by_id(session_id)
        if not session:
            raise SessionNotFound(f"Session {session_id} not found")

        new_session = session.answer(answer)
        saved_session = self._sessions.add(new_session)

        response = {
            "is_correct": new_session.current_index > session.current_index
            and new_session.correct_answers > session.correct_answers,
            "correct_answer": session.current_question.correct_answer if session.current_question else None,
            "session_complete": new_session.is_complete,
            "progress": {
                "current": new_session.current_index,
                "total": new_session.total_questions,
                "correct": new_session.correct_answers,
                "score": new_session.score,
            },
        }
        if new_session.current_question:
            response["next_question"] = new_session.current_question.to_dict()

        return AnsweredQuestion(saved_session, response)
