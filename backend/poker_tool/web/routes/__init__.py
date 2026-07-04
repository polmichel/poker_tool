"""
Flask Routes (Elegant Objects principles).
Registers all routes with injected services.
"""
from flask import Flask, Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest, NotFound
from ...services.range_service import RangeService
from ...services.auth_service import AuthService
from ...services.training_service import TrainingService
from ...domain.range import RangeType, Position, ActionType
from ...domain.user import User
from ...domain.hand import RANKS, generate_all_hands
import json


def register_routes(
    app: Flask,
    range_service: RangeService,
    auth_service: AuthService,
    training_service: TrainingService,
) -> None:
    """Register all routes with the Flask app and injected services."""
    
    # Create API blueprint
    api_bp = Blueprint("api", __name__, url_prefix="/api")
    
    # ==================== Health Check ====================
    @api_bp.route("/health", methods=["GET"])
    def health_check():
        """Health check endpoint."""
        return jsonify({
            "status": "healthy",
            "version": "1.0.0",
        })
    
    # ==================== Auth Routes ====================
    @api_bp.route("/auth/register", methods=["POST"])
    def register():
        """Register a new user."""
        data = request.get_json()
        if not data or "username" not in data or "email" not in data or "password" not in data:
            return jsonify({"error": "Missing required fields"}), 400
        
        success, user, error = auth_service.register_user(
            data["username"],
            data["email"],
            data["password"],
        )
        
        if not success:
            return jsonify({"error": error}), 400
        
        return jsonify({
            "message": "User registered successfully",
            "user": user.to_dict() if user else None,
        }), 201
    
    @api_bp.route("/auth/login", methods=["POST"])
    def login():
        """Login a user."""
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return jsonify({"error": "Missing username or password"}), 400
        
        success, user, error = auth_service.login_user(
            data["username"],
            data["password"],
        )
        
        if not success:
            return jsonify({"error": error}), 401
        
        # Create JWT token
        access_token = auth_service.create_access_token(user.id)
        
        return jsonify({
            "access_token": access_token,
            "user": user.to_dict(),
        })
    
    @api_bp.route("/auth/me", methods=["GET"])
    def get_current_user():
        """Get the current authenticated user."""
        user = auth_service.get_current_user()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user.to_dict())
    
    # ==================== Range Routes ====================
    @api_bp.route("/ranges", methods=["GET"])
    def get_all_ranges():
        """Get all poker ranges."""
        ranges = range_service.get_all_ranges()
        return jsonify([r.to_dict() for r in ranges])
    
    @api_bp.route("/ranges/<int:range_id>", methods=["GET"])
    def get_range(range_id: int):
        """Get a specific range."""
        range_obj = range_service.get_range_by_id(range_id)
        if not range_obj:
            raise NotFound(f"Range with ID {range_id} not found")
        return jsonify(range_obj.to_dict())
    
    @api_bp.route("/ranges", methods=["POST"])
    def create_range():
        """Create a new range."""
        data = request.get_json()
        if not data or "name" not in data:
            return jsonify({"error": "Missing required field: name"}), 400
        
        # Convert data to domain types
        range_type = RangeType[data.get("range_type", "preflop").upper()]
        position = Position[data.get("position", "undefined").upper()]
        
        # Convert hands to ActionType
        hands = {}
        if data.get("hands"):
            for hand_str, action in data["hands"].items():
                try:
                    hands[hand_str] = ActionType[action.upper()]
                except KeyError:
                    hands[hand_str] = ActionType.UNDEFINED
        
        range_obj = range_service.create_range(
            name=data["name"],
            description=data.get("description", ""),
            range_type=range_type,
            position=position,
            hands=hands,
            user_id=data.get("user_id"),
        )
        
        return jsonify(range_obj.to_dict()), 201
    
    @api_bp.route("/ranges/<int:range_id>", methods=["PUT"])
    def update_range(range_id: int):
        """Update a range."""
        range_obj = range_service.get_range_by_id(range_id)
        if not range_obj:
            raise NotFound(f"Range with ID {range_id} not found")
        
        data = request.get_json()
        if not data:
            raise BadRequest("No data provided")
        
        updated_range = range_service.update_range(range_id, data)
        if not updated_range:
            raise NotFound(f"Range with ID {range_id} not found")
        
        return jsonify(updated_range.to_dict())
    
    @api_bp.route("/ranges/<int:range_id>", methods=["DELETE"])
    def delete_range(range_id: int):
        """Delete a range."""
        success = range_service.delete_range(range_id)
        if not success:
            raise NotFound(f"Range with ID {range_id} not found")
        return jsonify({"message": f"Range with ID {range_id} deleted successfully"}), 200
    
    @api_bp.route("/ranges/<int:range_id>/grid", methods=["GET"])
    def get_range_grid(range_id: int):
        """Get the 13x13 grid for a range."""
        grid = range_service.get_range_grid(range_id)
        if grid is None:
            raise NotFound(f"Range with ID {range_id} not found")
        return jsonify({"grid": grid})
    
    @api_bp.route("/ranges/<int:range_id>/stats", methods=["GET"])
    def get_range_stats(range_id: int):
        """Get statistics for a range."""
        stats = range_service.get_range_statistics(range_id)
        if stats is None:
            raise NotFound(f"Range with ID {range_id} not found")
        return jsonify(stats)
    
    @api_bp.route("/ranges/default", methods=["GET"])
    def get_default_ranges():
        """Get default poker ranges."""
        return jsonify(range_service.get_default_ranges())
    
    # ==================== Training Routes ====================
    @api_bp.route("/training/modes", methods=["GET"])
    def get_training_modes():
        """Get available training modes."""
        modes = [
            {"id": "fill", "name": "Remplir une range", "description": "Compléter une grille de range"},
            {"id": "guess", "name": "Deviner une range", "description": "Déterminer si des mains font partie d'une range"},
            {"id": "complete", "name": "Compléter une range", "description": "Compléter une range partiellement remplie"},
        ]
        return jsonify(modes)
    
    @api_bp.route("/training/sessions", methods=["GET"])
    def get_training_sessions():
        """Get all training sessions."""
        sessions = training_service.get_all_sessions()
        return jsonify([{
            "id": s.id,
            "user_id": s.user_id,
            "range_id": s.range_id,
            "mode": s.mode,
            "score": s.score,
            "total_questions": s.total_questions,
            "correct_answers": s.correct_answers,
            "time_spent": s.time_spent,
        } for s in sessions])
    
    @api_bp.route("/training/sessions", methods=["POST"])
    def create_training_session():
        """Create a new training session."""
        data = request.get_json()
        if not data or "mode" not in data or "range_id" not in data:
            return jsonify({"error": "Missing required fields"}), 400
        
        session = training_service.create_session(
            user_id=data.get("user_id"),
            range_id=data["range_id"],
            mode=data["mode"],
        )
        
        return jsonify({
            "session": {
                "id": session.id,
                "user_id": session.user_id,
                "range_id": session.range_id,
                "mode": session.mode,
            },
            "first_question": None,  # Will be implemented later
        }), 201
    
    @api_bp.route("/training/sessions/<int:session_id>/next", methods=["POST"])
    def next_training_question(session_id: int):
        """Process the next question in a training session."""
        data = request.get_json()
        if not data or "answer" not in data:
            return jsonify({"error": "Missing answer field"}), 400
        
        result = training_service.next_question(session_id, data["answer"])
        return jsonify(result)
    
    @api_bp.route("/training/sessions/<int:session_id>/end", methods=["POST"])
    def end_training_session(session_id: int):
        """End a training session."""
        session = training_service.end_session(session_id)
        if not session:
            raise NotFound(f"Training session with ID {session_id} not found")
        return jsonify({"message": "Training session ended successfully"})
    
    # Register the blueprint
    app.register_blueprint(api_bp)
    
    # Home route
    @app.route("/")
    def home():
        """Home page."""
        return jsonify({
            "message": "Welcome to Poker Tool API",
            "version": "1.0.0",
            "docs": "/api/docs",
        })
