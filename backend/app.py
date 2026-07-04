from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
from .database import db, init_db, User, RangeModel, ScenarioModel, TrainingSession, Stat
from .routes import api_bp
import os


def create_app():
    """Crée et configure l'application Flask."""
    app = Flask(__name__)
    
    # Configuration de base
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "poker_tool_secret_key_12345")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "sqlite:///poker_tool.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "poker_tool_jwt_secret_12345")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
    
    # Initialiser les extensions
    CORS(app, resources={r"/*": {"origins": "*"}})
    jwt = JWTManager(app)
    init_db(app)
    
    # Enregistrer les routes
    app.register_blueprint(api_bp)
    
    # Routes pour l'authentification
    @app.route("/api/auth/register", methods=["POST"])
    def register():
        """Enregistre un nouvel utilisateur."""
        data = request.get_json()
        if not data or "username" not in data or "email" not in data or "password" not in data:
            return jsonify({"error": "Missing required fields"}), 400
        
        # Vérifier si l'utilisateur existe déjà
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"error": "Username already exists"}), 400
        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Email already exists"}), 400
        
        # Créer l'utilisateur
        user = User(
            username=data["username"],
            email=data["email"],
        )
        user.set_password(data["password"])
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({"message": "User registered successfully", "user": user.to_dict()}), 201
    
    @app.route("/api/auth/login", methods=["POST"])
    def login():
        """Connecte un utilisateur."""
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return jsonify({"error": "Missing username or password"}), 400
        
        user = User.query.filter_by(username=data["username"]).first()
        if not user or not user.check_password(data["password"]):
            return jsonify({"error": "Invalid username or password"}), 401
        
        # Créer un token JWT
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "access_token": access_token,
            "user": user.to_dict(),
        })
    
    @app.route("/api/auth/me", methods=["GET"])
    @jwt_required()
    def get_current_user():
        """Récupère l'utilisateur actuel."""
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user.to_dict())
    
    # Route pour vérifier l'état de l'API
    @app.route("/api/health", methods=["GET"])
    def health_check():
        """Vérifie que l'API fonctionne."""
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
            "timestamp": db.session.execute("SELECT CURRENT_TIMESTAMP").scalar() if db.engine else None,
        })
    
    # Route pour la page d'accueil
    @app.route("/")
    def home():
        """Page d'accueil."""
        return jsonify({
            "message": "Welcome to Poker Tool API",
            "version": "1.0.0",
            "docs": "/api/docs",
        })
    
    # Gestion des erreurs 404
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not found"}), 404
    
    # Gestion des erreurs 500
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app


# Créer l'application
app = create_app()


if __name__ == "__main__":
    # Créer les tables de la base de données
    with app.app_context():
        db.create_all()
    
    # Démarrer le serveur
    app.run(host="0.0.0.0", port=5000, debug=True)
