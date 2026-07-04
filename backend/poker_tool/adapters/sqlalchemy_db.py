"""
SQLAlchemy Database Adapter (Elegant Objects principles).
Concrete implementation of DatabasePort using SQLAlchemy.
"""
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from typing import List, Optional, Dict, Any
from ..ports.database import DatabasePort
from ..domain.range import Range, RangeType, Position, ActionType
from ..domain.user import User
from ..domain.scenario import Scenario, ScenarioType


# Create SQLAlchemy instance at module level
_db = SQLAlchemy()


class SQLAlchemyDatabase(DatabasePort):
    """SQLAlchemy implementation of DatabasePort."""
    
    def __init__(self, app: Any = None):
        """Initialize the database adapter."""
        global _db
        self.db = _db
        if app:
            self.init_app(app)
    
    def init_app(self, app: Any) -> None:
        """Initialize the database with the Flask app."""
        self.db.init_app(app)
        with app.app_context():
            self.db.create_all()
    
    def create_all(self) -> None:
        """Create all database tables."""
        self.db.create_all()
    
    def drop_all(self) -> None:
        """Drop all database tables."""
        self.db.drop_all()
    
    # User Model (SQLAlchemy)
    class _UserModel(_db.Model):
        __tablename__ = 'user'
        
        id = _db.Column(_db.Integer, primary_key=True)
        username = _db.Column(_db.String(80), unique=True, nullable=False)
        email = _db.Column(_db.String(120), unique=True, nullable=False)
        password_hash = _db.Column(_db.String(128))
        created_at = _db.Column(_db.DateTime, server_default=_db.func.now())
        updated_at = _db.Column(
            _db.DateTime,
            server_default=_db.func.now(),
            onupdate=_db.func.now()
        )
        
        def to_domain(self) -> User:
            """Convert SQLAlchemy model to domain object."""
            return User(
                id=self.id,
                username=self.username,
                email=self.email,
                password_hash=self.password_hash,
                created_at=self.created_at.isoformat() if self.created_at else None,
                updated_at=self.updated_at.isoformat() if self.updated_at else None,
            )
    
    # Range Model (SQLAlchemy)
    class _RangeModel(_db.Model):
        __tablename__ = 'poker_range'
        
        id = _db.Column(_db.Integer, primary_key=True)
        name = _db.Column(_db.String(120), nullable=False)
        description = _db.Column(_db.Text)
        range_type = _db.Column(
            _db.Enum('preflop', 'postflop', 'push_fold', name='range_type_enum')
        )
        position = _db.Column(
            _db.Enum('UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'undefined', name='position_enum')
        )
        hands = _db.Column(_db.JSON, default={})
        user_id = _db.Column(_db.Integer, _db.ForeignKey('user.id'), nullable=True)
        created_at = _db.Column(_db.DateTime, server_default=_db.func.now())
        updated_at = _db.Column(
            _db.DateTime,
            server_default=_db.func.now(),
            onupdate=_db.func.now()
        )
        
        def to_domain(self) -> Range:
            """Convert SQLAlchemy model to domain object."""
            hands_dict = {}
            if self.hands:
                for hand_str, action in self.hands.items():
                    try:
                        hands_dict[hand_str] = ActionType[action.upper()]
                    except KeyError:
                        hands_dict[hand_str] = ActionType.UNDEFINED
            
            return Range(
                id=self.id,
                name=self.name,
                description=self.description or "",
                range_type=RangeType[self.range_type.upper()] if self.range_type else RangeType.PREFLOP,
                position=Position[self.position] if self.position else Position.UNDEFINED,
                hands=hands_dict,
                user_id=self.user_id,
                created_at=self.created_at.isoformat() if self.created_at else None,
                updated_at=self.updated_at.isoformat() if self.updated_at else None,
            )
    
    # Training Session Model (SQLAlchemy)
    class _TrainingSessionModel(_db.Model):
        __tablename__ = 'training_session'
        
        id = _db.Column(_db.Integer, primary_key=True)
        user_id = _db.Column(_db.Integer, _db.ForeignKey('user.id'), nullable=True)
        range_id = _db.Column(_db.Integer, _db.ForeignKey('poker_range.id'), nullable=True)
        mode = _db.Column(_db.String(50), nullable=False)
        score = _db.Column(_db.Float, default=0.0)
        total_questions = _db.Column(_db.Integer, default=0)
        correct_answers = _db.Column(_db.Integer, default=0)
        time_spent = _db.Column(_db.Integer, default=0)
        details = _db.Column(_db.JSON, default={})
        created_at = _db.Column(_db.DateTime, server_default=_db.func.now())
        
        def to_dict(self) -> Dict[str, Any]:
            """Convert to dictionary."""
            return {
                "id": self.id,
                "user_id": self.user_id,
                "range_id": self.range_id,
                "mode": self.mode,
                "score": self.score,
                "total_questions": self.total_questions,
                "correct_answers": self.correct_answers,
                "time_spent": self.time_spent,
                "details": self.details or {},
                "created_at": self.created_at.isoformat() if self.created_at else None,
            }
    
    # Scenario Model (SQLAlchemy)
    class _ScenarioModel(_db.Model):
        __tablename__ = 'scenario'
        
        id = _db.Column(_db.Integer, primary_key=True)
        name = _db.Column(_db.String(120), nullable=False)
        description = _db.Column(_db.Text)
        scenario_type = _db.Column(
            _db.Enum('cash_game', 'tournament', 'push_fold', 'heads_up', name='scenario_type_enum')
        )
        stack_size = _db.Column(_db.Float)
        position = _db.Column(
            _db.Enum('UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'undefined', name='position_enum')
        )
        action = _db.Column(_db.String(120))
        range_id = _db.Column(_db.Integer, _db.ForeignKey('poker_range.id'), nullable=True)
        user_id = _db.Column(_db.Integer, _db.ForeignKey('user.id'), nullable=True)
        created_at = _db.Column(_db.DateTime, server_default=_db.func.now())
        updated_at = _db.Column(
            _db.DateTime,
            server_default=_db.func.now(),
            onupdate=_db.func.now()
        )
        
        def to_domain(self) -> Scenario:
            """Convert SQLAlchemy model to domain object."""
            return Scenario(
                id=self.id,
                name=self.name,
                description=self.description or "",
                scenario_type=ScenarioType[self.scenario_type.upper().replace('-', '_')] 
                    if self.scenario_type else ScenarioType.CASH_GAME,
                stack_size=self.stack_size,
                position=Position[self.position] if self.position else Position.UNDEFINED,
                action=self.action or "",
                range_id=self.range_id,
                user_id=self.user_id,
                created_at=self.created_at.isoformat() if self.created_at else None,
                updated_at=self.updated_at.isoformat() if self.updated_at else None,
            )
    
    # User operations
    def save_user(self, user: User) -> User:
        """Save a user to the database."""
        model = self._UserModel(
            id=user.id,
            username=user.username,
            email=user.email,
            password_hash=user.password_hash,
        )
        self.db.session.add(model)
        self.db.session.commit()
        return model.to_domain()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        model = self._UserModel.query.get(user_id)
        return model.to_domain() if model else None
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        model = self._UserModel.query.filter_by(username=username).first()
        return model.to_domain() if model else None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        model = self._UserModel.query.filter_by(email=email).first()
        return model.to_domain() if model else None
    
    def get_all_users(self) -> List[User]:
        """Get all users."""
        models = self._UserModel.query.all()
        return [model.to_domain() for model in models]
    
    # Range operations
    def save_range(self, range_obj: Range) -> Range:
        """Save a range to the database."""
        hands_dict = {k: v.name.lower() for k, v in range_obj.hands.items()}
        model = self._RangeModel(
            id=range_obj.id,
            name=range_obj.name,
            description=range_obj.description,
            range_type=range_obj.range_type.name.lower() if range_obj.range_type else 'preflop',
            position=range_obj.position.name if range_obj.position else 'undefined',
            hands=hands_dict,
            user_id=range_obj.user_id,
        )
        self.db.session.add(model)
        self.db.session.commit()
        return model.to_domain()
    
    def get_range_by_id(self, range_id: int) -> Optional[Range]:
        """Get a range by ID."""
        model = self._RangeModel.query.get(range_id)
        return model.to_domain() if model else None
    
    def get_all_ranges(self) -> List[Range]:
        """Get all ranges."""
        models = self._RangeModel.query.all()
        return [model.to_domain() for model in models]
    
    def get_ranges_by_user(self, user_id: int) -> List[Range]:
        """Get all ranges for a specific user."""
        models = self._RangeModel.query.filter_by(user_id=user_id).all()
        return [model.to_domain() for model in models]
    
    def update_range(self, range_id: int, data: Dict) -> Optional[Range]:
        """Update a range."""
        model = self._RangeModel.query.get(range_id)
        if not model:
            return None
        
        if 'name' in data:
            model.name = data['name']
        if 'description' in data:
            model.description = data['description']
        if 'range_type' in data:
            model.range_type = data['range_type']
        if 'position' in data:
            model.position = data['position']
        if 'hands' in data:
            model.hands = data['hands']
        
        model.updated_at = self.db.func.now()
        self.db.session.commit()
        return model.to_domain()
    
    def delete_range(self, range_id: int) -> bool:
        """Delete a range."""
        model = self._RangeModel.query.get(range_id)
        if not model:
            return False
        self.db.session.delete(model)
        self.db.session.commit()
        return True
    
    # Training Session operations
    def save_training_session(self, session_data: Dict) -> Dict:
        """Save a training session to the database."""
        model = self._TrainingSessionModel(
            id=session_data.get('id'),
            user_id=session_data.get('user_id'),
            range_id=session_data.get('range_id'),
            mode=session_data.get('mode', ''),
            score=session_data.get('score', 0.0),
            total_questions=session_data.get('total_questions', 0),
            correct_answers=session_data.get('correct_answers', 0),
            time_spent=session_data.get('time_spent', 0),
            details=session_data.get('details', {}),
        )
        self.db.session.add(model)
        self.db.session.commit()
        return model.to_dict()
    
    def get_training_session_by_id(self, session_id: int) -> Optional[Dict]:
        """Get a training session by ID."""
        model = self._TrainingSessionModel.query.get(session_id)
        return model.to_dict() if model else None
    
    def get_all_training_sessions(self) -> List[Dict]:
        """Get all training sessions."""
        models = self._TrainingSessionModel.query.all()
        return [model.to_dict() for model in models]
    
    def get_training_sessions_by_user(self, user_id: int) -> List[Dict]:
        """Get all training sessions for a specific user."""
        models = self._TrainingSessionModel.query.filter_by(user_id=user_id).all()
        return [model.to_dict() for model in models]
    
    def update_training_session(self, session_id: int, data: Dict) -> Optional[Dict]:
        """Update a training session."""
        model = self._TrainingSessionModel.query.get(session_id)
        if not model:
            return None
        
        if 'user_id' in data:
            model.user_id = data['user_id']
        if 'range_id' in data:
            model.range_id = data['range_id']
        if 'mode' in data:
            model.mode = data['mode']
        if 'score' in data:
            model.score = data['score']
        if 'total_questions' in data:
            model.total_questions = data['total_questions']
        if 'correct_answers' in data:
            model.correct_answers = data['correct_answers']
        if 'time_spent' in data:
            model.time_spent = data['time_spent']
        if 'details' in data:
            model.details = data['details']
        
        self.db.session.commit()
        return model.to_dict()
    
    def delete_training_session(self, session_id: int) -> bool:
        """Delete a training session."""
        model = self._TrainingSessionModel.query.get(session_id)
        if not model:
            return False
        self.db.session.delete(model)
        self.db.session.commit()
        return True
    
    # Scenario operations
    def save_scenario(self, scenario: Scenario) -> Scenario:
        """Save a scenario to the database."""
        model = self._ScenarioModel(
            id=scenario.id,
            name=scenario.name,
            description=scenario.description,
            scenario_type=scenario.scenario_type.name.lower().replace('_', '-') 
                if scenario.scenario_type else 'cash_game',
            stack_size=scenario.stack_size,
            position=scenario.position.name if scenario.position else 'undefined',
            action=scenario.action,
            range_id=scenario.range_id,
            user_id=scenario.user_id,
        )
        self.db.session.add(model)
        self.db.session.commit()
        return model.to_domain()
    
    def get_scenario_by_id(self, scenario_id: int) -> Optional[Scenario]:
        """Get a scenario by ID."""
        model = self._ScenarioModel.query.get(scenario_id)
        return model.to_domain() if model else None
    
    def get_all_scenarios(self) -> List[Scenario]:
        """Get all scenarios."""
        models = self._ScenarioModel.query.all()
        return [model.to_domain() for model in models]
    
    def get_scenarios_by_user(self, user_id: int) -> List[Scenario]:
        """Get all scenarios for a specific user."""
        models = self._ScenarioModel.query.filter_by(user_id=user_id).all()
        return [model.to_domain() for model in models]
    
    def delete_scenario(self, scenario_id: int) -> bool:
        """Delete a scenario."""
        model = self._ScenarioModel.query.get(scenario_id)
        if not model:
            return False
        self.db.session.delete(model)
        self.db.session.commit()
        return True
