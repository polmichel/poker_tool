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


class SQLAlchemyDatabase(DatabasePort):
    """SQLAlchemy implementation of DatabasePort."""
    
    def __init__(self, app: Any = None):
        """Initialize the database adapter."""
        self.db = SQLAlchemy()
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
    class _UserModel(self.db.Model):
        __tablename__ = 'user'
        
        id = self.db.Column(self.db.Integer, primary_key=True)
        username = self.db.Column(self.db.String(80), unique=True, nullable=False)
        email = self.db.Column(self.db.String(120), unique=True, nullable=False)
        password_hash = self.db.Column(self.db.String(128))
        created_at = self.db.Column(self.db.DateTime, server_default=self.db.func.now())
        updated_at = self.db.Column(
            self.db.DateTime,
            server_default=self.db.func.now(),
            onupdate=self.db.func.now()
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
    class _RangeModel(self.db.Model):
        __tablename__ = 'poker_range'
        
        id = self.db.Column(self.db.Integer, primary_key=True)
        name = self.db.Column(self.db.String(120), nullable=False)
        description = self.db.Column(self.db.Text)
        range_type = self.db.Column(
            self.db.Enum('preflop', 'postflop', 'push_fold', name='range_type_enum')
        )
        position = self.db.Column(
            self.db.Enum('UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'undefined', name='position_enum')
        )
        hands = self.db.Column(self.db.JSON, default={})
        user_id = self.db.Column(self.db.Integer, self.db.ForeignKey('user.id'), nullable=True)
        created_at = self.db.Column(self.db.DateTime, server_default=self.db.func.now())
        updated_at = self.db.Column(
            self.db.DateTime,
            server_default=self.db.func.now(),
            onupdate=self.db.func.now()
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
    
    # Scenario Model (SQLAlchemy)
    class _ScenarioModel(self.db.Model):
        __tablename__ = 'scenario'
        
        id = self.db.Column(self.db.Integer, primary_key=True)
        name = self.db.Column(self.db.String(120), nullable=False)
        description = self.db.Column(self.db.Text)
        scenario_type = self.db.Column(
            self.db.Enum('cash_game', 'tournament', 'push_fold', 'heads_up', name='scenario_type_enum')
        )
        stack_size = self.db.Column(self.db.Float)
        position = self.db.Column(
            self.db.Enum('UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'undefined', name='position_enum')
        )
        action = self.db.Column(self.db.String(120))
        range_id = self.db.Column(self.db.Integer, self.db.ForeignKey('poker_range.id'), nullable=True)
        user_id = self.db.Column(self.db.Integer, self.db.ForeignKey('user.id'), nullable=True)
        created_at = self.db.Column(self.db.DateTime, server_default=self.db.func.now())
        updated_at = self.db.Column(
            self.db.DateTime,
            server_default=self.db.func.now(),
            onupdate=self.db.func.now()
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
