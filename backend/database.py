from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

from models.range import RangeType, Position
from models.scenario import ScenarioType

# Initialisation de SQLAlchemy
db = SQLAlchemy()


# Modèles SQLAlchemy
class User(db.Model):
    """Modèle pour les utilisateurs."""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RangeModel(db.Model):
    """Modèle pour les ranges de poker."""
    __tablename__ = "poker_range"
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    range_type = db.Column(db.Enum(RangeType, name="range_type_enum"), default=RangeType.PREFLOP)
    position = db.Column(db.Enum(Position, name="position_enum"), default=Position.UNDEFINED)
    hands = db.Column(db.JSON, default={})  # {"AKs": "open", "AA": "raise", ...}
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "range_type": self.range_type.value if self.range_type else None,
            "position": self.position.value if self.position else None,
            "hands": self.hands or {},
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ScenarioModel(db.Model):
    """Modèle pour les scénarios de poker."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text)
    scenario_type = db.Column(db.Enum(ScenarioType, name="scenario_type_enum"), default=ScenarioType.CASH_GAME)
    stack_size = db.Column(db.Float)
    position = db.Column(db.Enum(Position, name="position_enum"), default=Position.UNDEFINED)
    action = db.Column(db.String(120))
    range_id = db.Column(db.Integer, db.ForeignKey("poker_range.id"), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "scenario_type": self.scenario_type.value if self.scenario_type else None,
            "stack_size": self.stack_size,
            "position": self.position.value if self.position else None,
            "action": self.action,
            "range_id": self.range_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class TrainingSession(db.Model):
    """Modèle pour les sessions d'entraînement."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    range_id = db.Column(db.Integer, db.ForeignKey("poker_range.id"), nullable=True)
    mode = db.Column(db.String(50))  # "fill", "guess", "complete"
    score = db.Column(db.Float, default=0.0)
    total_questions = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)
    time_spent = db.Column(db.Integer, default=0)  # En secondes
    details = db.Column(db.JSON, default={})  # Détails des réponses
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
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


class Stat(db.Model):
    """Modèle pour les statistiques globales."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    total_ranges = db.Column(db.Integer, default=0)
    total_training_sessions = db.Column(db.Integer, default=0)
    avg_score = db.Column(db.Float, default=0.0)
    total_time_spent = db.Column(db.Integer, default=0)  # En secondes
    last_activity = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "total_ranges": self.total_ranges,
            "total_training_sessions": self.total_training_sessions,
            "avg_score": self.avg_score,
            "total_time_spent": self.total_time_spent,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
        }


# Fonctions utilitaires pour la base de données
def init_db(app):
    """Initialise la base de données avec l'application Flask."""
    db.init_app(app)
    with app.app_context():
        db.create_all()
        # Créer les énumérations si elles n'existent pas
        _create_enums(app)


def _create_enums(app):
    """Crée les types énumérés pour la base de données."""
    from flask_sqlalchemy import get_engine
    engine = get_engine(app)
    
    # Vérifier si les énumérations existent déjà
    inspector = db.inspect(engine)
    if "range_type_enum" not in [enum["name"] for enum in inspector.get_enums()]:
        with engine.connect() as conn:
            conn.execute(db.text("""
                CREATE TYPE range_type_enum AS ENUM ('preflop', 'postflop', 'push_fold');
            """))
            conn.execute(db.text("""
                CREATE TYPE position_enum AS ENUM ('UTG', 'MP', 'CO', 'BTN', 'SB', 'BB', 'undefined');
            """))
            conn.execute(db.text("""
                CREATE TYPE scenario_type_enum AS ENUM ('cash_game', 'tournament', 'push_fold', 'heads_up');
            """))
            conn.commit()


def reset_db(app):
    """Réinitialise la base de données (ATTENTION : supprime toutes les données)."""
    with app.app_context():
        db.drop_all()
        db.create_all()
        _create_enums(app)


def backup_db(app, backup_path: str):
    """Sauvegarde la base de données dans un fichier JSON."""
    import json

    with app.app_context():
        ranges = RangeModel.query.all()
        scenarios = ScenarioModel.query.all()
        users = User.query.all()
        training_sessions = TrainingSession.query.all()
        
        backup_data = {
            "ranges": [r.to_dict() for r in ranges],
            "scenarios": [s.to_dict() for s in scenarios],
            "users": [u.to_dict() for u in users],
            "training_sessions": [t.to_dict() for t in training_sessions],
            "metadata": {
                "backup_date": datetime.utcnow().isoformat(),
                "app_version": "1.0.0",
            }
        }
        
        with open(backup_path, "w") as f:
            json.dump(backup_data, f, indent=2)
        
        return backup_path


def restore_db(app, backup_path: str):
    """Restaure la base de données depuis un fichier JSON."""
    import json
    
    with app.app_context():
        with open(backup_path, "r") as f:
            backup_data = json.load(f)
        
        # Supprimer les données existantes
        db.session.query(RangeModel).delete()
        db.session.query(ScenarioModel).delete()
        db.session.query(User).delete()
        db.session.query(TrainingSession).delete()
        db.session.commit()
        
        # Insérer les nouvelles données
        for range_data in backup_data.get("ranges", []):
            range_obj = RangeModel(**range_data)
            db.session.add(range_obj)
        
        for scenario_data in backup_data.get("scenarios", []):
            scenario_obj = ScenarioModel(**scenario_data)
            db.session.add(scenario_obj)
        
        for user_data in backup_data.get("users", []):
            user_obj = User(**user_data)
            db.session.add(user_obj)
        
        for training_data in backup_data.get("training_sessions", []):
            training_obj = TrainingSession(**training_data)
            db.session.add(training_obj)
        
        db.session.commit()


if __name__ == "__main__":
    print("Database models loaded successfully.")
