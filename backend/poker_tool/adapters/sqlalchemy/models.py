"""
SQLAlchemy models for Poker Tool.
These models are internal implementation details of the SQLAlchemy adapter.
"""
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Create SQLAlchemy instance (will be initialized by the adapter)
db = SQLAlchemy()


class RangeModel(db.Model):
    """SQLAlchemy model for Range."""
    __tablename__ = 'poker_range'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, default='')
    range_type = db.Column(db.String(20), default='preflop')
    position = db.Column(db.String(20), default='undefined')
    hands = db.Column(db.JSON, default={})  # Dict[str, str] (hand_str -> action_str)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_domain(self):
        """Convert to domain Range object."""
        from ...objects.range import Range
        from ...objects.action import Action, ActionType
        from ...objects.range_type import RangeType
        from ...objects.position import Position

        hands = {
            hand_str: Action(ActionType[action.upper()])
            for hand_str, action in (self.hands or {}).items()
        }
        return Range(
            name=self.name,
            description=self.description or "",
            range_type=RangeType[self.range_type.upper()] if self.range_type else RangeType.PREFLOP,
            position=Position[self.position] if self.position else Position.UNDEFINED,
            hands=hands,
            user_id=self.user_id,
            range_id=self.id,
        )


class UserModel(db.Model):
    """SQLAlchemy model for User."""
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_domain(self):
        """Convert to domain User object."""
        from ...objects.user import User
        return User(
            username=self.username,
            email=self.email,
            password_hash=self.password_hash,
            user_id=self.id,
        )


class TrainingSessionModel(db.Model):
    """SQLAlchemy model for TrainingSession."""
    __tablename__ = 'training_session'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    range_id = db.Column(db.Integer, db.ForeignKey('poker_range.id'), nullable=False)
    mode = db.Column(db.String(20), default='fill')
    total_questions = db.Column(db.Integer, default=10)
    current_question_index = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)
    score = db.Column(db.Float, default=0.0)
    time_spent = db.Column(db.Integer, default=0)
    is_complete = db.Column(db.Boolean, default=False)
    details = db.Column(db.JSON, default={})  # Contains questions, start_time, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_domain(self):
        """Convert to domain TrainingSession object."""
        from ...objects.training.session import TrainingSession
        from ...objects.user import User
        from ...objects.range import Range

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

        # Set internal state from model
        session._current_index = self.current_question_index
        session._correct_answers = self.correct_answers
        session._start_time = datetime.fromisoformat(self.created_at.isoformat())
        if self.details.get("ended_at"):
            session._ended_at = datetime.fromisoformat(self.details["ended_at"])

        return session
