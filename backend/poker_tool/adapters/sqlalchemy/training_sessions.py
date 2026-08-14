"""
SQLAlchemy implementation of the :class:`TrainingSessions` port (Elegant Objects).
"""

from ...interfaces.training_sessions import TrainingSessions
from ...objects.training.session import TrainingSession
from .models import TrainingSessionModel, db


class SqlTrainingSessions(TrainingSessions):
    """SQLAlchemy implementation of the TrainingSessions port."""

    def __init__(self, app=None) -> None:
        self.db = db
        if app:
            self.init_app(app)

    def init_app(self, app) -> None:
        """Initialize SQLAlchemy with a Flask app and create tables.

        Only initializes once even if called from multiple Sql* adapters,
        because the ``db`` instance is shared.
        """
        if not getattr(app, "_sqlalchemy_initialized", False):
            self.db.init_app(app)
            app._sqlalchemy_initialized = True
        with app.app_context():
            self.db.create_all()

    def add(self, session: TrainingSession) -> TrainingSession:
        """Add a new session or update an existing one; return the stored session."""
        details = {
            "start_time": session._start_time.isoformat(),
            "ended_at": session._ended_at.isoformat() if session._ended_at else None,
            "questions": [q.to_dict() for q in session._questions],
        }

        if session.id:
            model = TrainingSessionModel.query.get(session.id)
            if model:
                model.user_id = session.user.id
                model.range_id = session.range.id
                model.mode = session.mode
                model.total_questions = session.total_questions
                model.current_question_index = session.current_index
                model.correct_answers = session.correct_answers
                model.score = session.score
                model.time_spent = session.time_spent
                model.is_complete = session.is_complete
                model.details = details
        else:
            model = TrainingSessionModel(
                user_id=session.user.id,
                range_id=session.range.id,
                mode=session.mode,
                total_questions=session.total_questions,
                current_question_index=session.current_index,
                correct_answers=session.correct_answers,
                score=session.score,
                time_spent=session.time_spent,
                is_complete=session.is_complete,
                details=details,
            )
            self.db.session.add(model)
        self.db.session.commit()
        return model.to_domain()

    def session_by_id(self, session_id: int) -> TrainingSession | None:
        model = TrainingSessionModel.query.get(session_id)
        return model.to_domain() if model else None

    def all(self) -> list[TrainingSession]:
        return [model.to_domain() for model in TrainingSessionModel.query.all()]

    def sessions_by_user(self, user_id: int) -> list[TrainingSession]:
        return [
            model.to_domain()
            for model in TrainingSessionModel.query.filter_by(user_id=user_id).all()
        ]
