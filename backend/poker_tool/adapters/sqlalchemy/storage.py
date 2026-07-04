"""
SQLAlchemy implementation of the Storage interface (Elegant Objects).
"""
from typing import List, Optional, Any
from flask_sqlalchemy import SQLAlchemy
from ...interfaces.storage import Storage
from ...objects.range import Range
from ...objects.user import User
from ...objects.training.session import TrainingSession
from .models import db, RangeModel, UserModel, TrainingSessionModel


class SqlAlchemyStorage(Storage):
    """SQLAlchemy implementation of Storage interface."""

    def __init__(self, app: Any = None):
        """Initialize the storage adapter."""
        self.db = db
        if app:
            self.init_app(app)

    def init_app(self, app: Any) -> None:
        """Initialize with Flask app."""
        self.db.init_app(app)
        with app.app_context():
            self.db.create_all()

    def save(self, obj: object) -> object:
        """Save an object to the database."""
        if isinstance(obj, Range):
            return self._save_range(obj)
        elif isinstance(obj, User):
            return self._save_user(obj)
        elif isinstance(obj, TrainingSession):
            return self._save_session(obj)
        else:
            raise TypeError(f"Cannot save object of type {type(obj)}")

    def get(self, obj_type: type, obj_id: int) -> Optional[object]:
        """Get an object by ID."""
        if obj_type == Range:
            return self._get_range(obj_id)
        elif obj_type == User:
            return self._get_user(obj_id)
        elif obj_type == TrainingSession:
            return self._get_session(obj_id)
        else:
            raise TypeError(f"Cannot get object of type {obj_type}")

    def all(self, obj_type: type) -> List[object]:
        """Get all objects of a type."""
        if obj_type == Range:
            return self._all_ranges()
        elif obj_type == User:
            return self._all_users()
        elif obj_type == TrainingSession:
            return self._all_sessions()
        else:
            raise TypeError(f"Cannot get all objects of type {obj_type}")

    def remove(self, obj: object) -> None:
        """Remove an object from the database."""
        if isinstance(obj, Range):
            self._remove_range(obj)
        elif isinstance(obj, User):
            self._remove_user(obj)
        elif isinstance(obj, TrainingSession):
            self._remove_session(obj)
        else:
            raise TypeError(f"Cannot remove object of type {type(obj)}")

    # Range-specific methods
    def ranges_by_user(self, user_id: int) -> List[Range]:
        """Get all ranges for a user."""
        return [
            model.to_domain()
            for model in RangeModel.query.filter_by(user_id=user_id).all()
        ]

    # Session-specific methods
    def sessions_by_user(self, user_id: int) -> List[TrainingSession]:
        """Get all training sessions for a user."""
        return [
            model.to_domain()
            for model in TrainingSessionModel.query.filter_by(user_id=user_id).all()
        ]

    # User-specific methods
    def user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        model = UserModel.query.filter_by(email=email).first()
        return model.to_domain() if model else None

    def user_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        model = UserModel.query.filter_by(username=username).first()
        return model.to_domain() if model else None

    # Private implementation methods
    def _save_range(self, range_obj: Range) -> Range:
        """Save a Range object."""
        hands_dict = {k: str(v) for k, v in range_obj.hands.items()}
        
        if range_obj.id:
            # Update existing range
            model = RangeModel.query.get(range_obj.id)
            if model:
                model.name = range_obj.name
                model.description = range_obj.description
                model.range_type = range_obj.type.name.lower()
                model.position = range_obj.position.name
                model.hands = hands_dict
                model.user_id = range_obj.user_id
                model.updated_at = Any  # Will be set by SQLAlchemy
        else:
            # Create new range
            model = RangeModel(
                name=range_obj.name,
                description=range_obj.description,
                range_type=range_obj.type.name.lower(),
                position=range_obj.position.name,
                hands=hands_dict,
                user_id=range_obj.user_id,
            )
            self.db.session.add(model)
        
        self.db.session.commit()
        return model.to_domain()

    def _get_range(self, range_id: int) -> Optional[Range]:
        """Get a Range by ID."""
        model = RangeModel.query.get(range_id)
        return model.to_domain() if model else None

    def _all_ranges(self) -> List[Range]:
        """Get all Ranges."""
        return [model.to_domain() for model in RangeModel.query.all()]

    def _remove_range(self, range_obj: Range) -> None:
        """Remove a Range."""
        if range_obj.id:
            model = RangeModel.query.get(range_obj.id)
            if model:
                self.db.session.delete(model)
                self.db.session.commit()

    def _save_user(self, user: User) -> User:
        """Save a User object."""
        if user.id:
            # Update existing user
            model = UserModel.query.get(user.id)
            if model:
                model.username = user.username
                model.email = user.email
                model.password_hash = user.password_hash
                model.updated_at = Any  # Will be set by SQLAlchemy
        else:
            # Create new user
            model = UserModel(
                username=user.username,
                email=user.email,
                password_hash=user.password_hash,
            )
            self.db.session.add(model)
        
        self.db.session.commit()
        return model.to_domain()

    def _get_user(self, user_id: int) -> Optional[User]:
        """Get a User by ID."""
        model = UserModel.query.get(user_id)
        return model.to_domain() if model else None

    def _all_users(self) -> List[User]:
        """Get all Users."""
        return [model.to_domain() for model in UserModel.query.all()]

    def _remove_user(self, user: User) -> None:
        """Remove a User."""
        if user.id:
            model = UserModel.query.get(user.id)
            if model:
                self.db.session.delete(model)
                self.db.session.commit()

    def _save_session(self, session: TrainingSession) -> TrainingSession:
        """Save a TrainingSession object."""
        if session.id:
            # Update existing session
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
                model.details = {
                    "start_time": session._start_time.isoformat(),
                    "ended_at": session._ended_at.isoformat() if session._ended_at else None,
                }
                model.updated_at = Any  # Will be set by SQLAlchemy
        else:
            # Create new session
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
                details={
                    "start_time": session._start_time.isoformat(),
                    "ended_at": session._ended_at.isoformat() if session._ended_at else None,
                },
            )
            self.db.session.add(model)
        
        self.db.session.commit()
        return model.to_domain()

    def _get_session(self, session_id: int) -> Optional[TrainingSession]:
        """Get a TrainingSession by ID."""
        model = TrainingSessionModel.query.get(session_id)
        return model.to_domain() if model else None

    def _all_sessions(self) -> List[TrainingSession]:
        """Get all TrainingSessions."""
        return [model.to_domain() for model in TrainingSessionModel.query.all()]

    def _remove_session(self, session: TrainingSession) -> None:
        """Remove a TrainingSession."""
        if session.id:
            model = TrainingSessionModel.query.get(session.id)
            if model:
                self.db.session.delete(model)
                self.db.session.commit()
