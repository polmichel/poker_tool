"""
SQLAlchemy models for Poker Tool.
These models are internal implementation details of the SQLAlchemy adapter.
"""

from datetime import UTC, datetime
from typing import Any

from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text

# Create SQLAlchemy instance (will be initialized by the adapter)
db: SQLAlchemy = SQLAlchemy()

# Type alias to satisfy mypy - db.Model is created at runtime
Model: Any = db.Model


def _utcnow_naive():
    """Return current UTC time as a naive datetime (for SQLAlchemy defaults)."""
    return datetime.now(UTC).replace(tzinfo=None)


class RangeModel(Model):
    """SQLAlchemy model for Range."""

    __tablename__ = "poker_range"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    range_type = Column(String(20), default="preflop")
    position = Column(String(20), default="undefined")
    effective_stack_bb = Column(Integer, nullable=True)
    hands = Column(JSON, default={})  # Dict[str, str] (hand_str -> action_str)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow_naive)
    updated_at = Column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    def to_domain(self):
        """Convert to domain Range object."""
        from ...objects.action import Action, ActionType
        from ...objects.position import Position
        from ...objects.range import Range
        from ...objects.range_type import RangeType

        hands = {hand_str: Action(ActionType[action.upper()]) for hand_str, action in (self.hands or {}).items()}
        return Range(
            name=self.name,
            description=self.description or "",
            range_type=RangeType[self.range_type.upper()] if self.range_type else RangeType.PREFLOP,
            position=Position[self.position] if self.position else Position.UNDEFINED,
            hands=hands,
            user_id=self.user_id,
            range_id=self.id,
            effective_stack_bb=self.effective_stack_bb,
        )


class UserModel(Model):
    """SQLAlchemy model for User."""

    __tablename__ = "user"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=_utcnow_naive)
    updated_at = Column(DateTime, default=_utcnow_naive, onupdate=_utcnow_naive)

    def to_domain(self):
        """Convert to domain User object."""
        from ...objects.user import User

        return User(
            username=self.username,
            email=self.email,
            password_hash=self.password_hash,
            user_id=self.id,
        )


class TrainingSessionModel(Model):
    """SQLAlchemy model for TrainingSession."""

    __tablename__ = "training_session"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    range_id = Column(Integer, ForeignKey("poker_range.id"), nullable=False)
    mode = Column(String(20), default="fill")
    total_questions = Column(Integer, default=10)
    current_question_index = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    score = Column(Float, default=0.0)
    time_spent = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)
    details = Column(JSON, default={})  # Contains questions, start_time, etc.
    created_at = Column(DateTime, default=_utcnow_naive)

    def to_domain(self):
        """Convert to domain TrainingSession object."""
        from ...objects.range import Range
        from ...objects.training.question import TrainingQuestion
        from ...objects.training.session import TrainingSession
        from ...objects.user import User

        # Get user and range from storage (simplified for now)
        user = User(username="", email="", user_id=self.user_id)
        range_obj = Range(name="", range_id=self.range_id)

        session = TrainingSession(
            user=user,
            range_obj=range_obj,
            mode=self.mode,
            total_questions=self.total_questions,
            session_id=self.id,
        )

        # Restore persisted questions instead of the freshly (randomly)
        # generated ones, so answers/progress stay consistent across reloads.
        saved_questions = (self.details or {}).get("questions") or []
        if saved_questions:
            session._questions = [TrainingQuestion.from_dict(q) for q in saved_questions]

        # Set internal state from model
        session._current_index = self.current_question_index
        session._correct_answers = self.correct_answers
        session._start_time = datetime.fromisoformat(self.created_at.isoformat())
        if (self.details or {}).get("ended_at"):
            session._ended_at = datetime.fromisoformat(self.details["ended_at"])

        return session
