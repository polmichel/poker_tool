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
        
        # Get user_id from auth if not provided
        user_id = data.get("user_id")
        if user_id is None:
            current_user = auth_service.get_current_user()
            if current_user:
                user_id = current_user.id
        
        range_obj = range_service.create_range(
            name=data["name"],
            description=data.get("description", ""),
            range_type=range_type,
            position=position,
            hands=hands,
            user_id=user_id,
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
    
    # ==================== Stats Routes ====================
    @api_bp.route("/stats/", methods=["GET"])
    def get_global_stats():
        """Get global statistics."""
        # Get all ranges
        all_ranges = range_service.get_all_ranges()
        total_ranges = len(all_ranges)
        
        # Get all training sessions
        all_sessions = training_service.get_all_sessions()
        total_training_sessions = len(all_sessions)
        
        # Calculate average score
        if all_sessions:
            avg_score = sum(s.score for s in all_sessions) / len(all_sessions)
        else:
            avg_score = 0.0
        
        # Calculate total time spent
        total_time_spent = sum(s.time_spent for s in all_sessions)
        
        return jsonify({
            "total_ranges": total_ranges,
            "total_training_sessions": total_training_sessions,
            "avg_score": round(avg_score, 2),
            "total_time_spent": total_time_spent,
        })
    
    @api_bp.route("/stats/user/<int:user_id>", methods=["GET"])
    def get_user_stats(user_id: int):
        """Get statistics for a specific user."""
        # Get user ranges
        user_ranges = range_service.get_ranges_by_user(user_id)
        
        # Get user training sessions
        all_sessions = training_service.get_all_sessions()
        user_sessions = [s for s in all_sessions if s.user_id == user_id]
        
        # Calculate user statistics
        total_ranges = len(user_ranges)
        total_training_sessions = len(user_sessions)
        
        if user_sessions:
            avg_score = sum(s.score for s in user_sessions) / len(user_sessions)
            total_time_spent = sum(s.time_spent for s in user_sessions)
            total_questions = sum(s.total_questions for s in user_sessions)
            correct_answers = sum(s.correct_answers for s in user_sessions)
        else:
            avg_score = 0.0
            total_time_spent = 0
            total_questions = 0
            correct_answers = 0
        
        # Calculate mode stats
        mode_stats = {}
        for mode in ["fill", "guess", "complete"]:
            mode_sessions = [s for s in user_sessions if s.mode == mode]
            if mode_sessions:
                mode_stats[mode] = {
                    "total_sessions": len(mode_sessions),
                    "total_questions": sum(s.total_questions for s in mode_sessions),
                    "correct_answers": sum(s.correct_answers for s in mode_sessions),
                    "avg_score": round(sum(s.score for s in mode_sessions) / len(mode_sessions), 2),
                }
            else:
                mode_stats[mode] = {
                    "total_sessions": 0,
                    "total_questions": 0,
                    "correct_answers": 0,
                    "avg_score": 0.0,
                }
        
        # Calculate range stats
        range_stats = {}
        for range_obj in user_ranges:
            range_sessions = [s for s in user_sessions if s.range_id == range_obj.id]
            if range_sessions:
                range_stats[range_obj.id] = {
                    "total_sessions": len(range_sessions),
                    "total_questions": sum(s.total_questions for s in range_sessions),
                    "correct_answers": sum(s.correct_answers for s in range_sessions),
                    "avg_score": round(sum(s.score for s in range_sessions) / len(range_sessions), 2),
                }
            else:
                range_stats[range_obj.id] = {
                    "total_sessions": 0,
                    "total_questions": 0,
                    "correct_answers": 0,
                    "avg_score": 0.0,
                }
        
        return jsonify({
            "total_ranges": total_ranges,
            "total_training_sessions": total_training_sessions,
            "avg_score": round(avg_score, 2),
            "total_time_spent": total_time_spent,
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "mode_stats": mode_stats,
            "range_stats": range_stats,
        })
    
    @api_bp.route("/stats/range/<int:range_id>", methods=["GET"])
    def get_range_stats_detail(range_id: int):
        """Get detailed statistics for a specific range."""
        stats = range_service.get_range_statistics(range_id)
        if stats is None:
            raise NotFound(f"Range with ID {range_id} not found")
        return jsonify(stats)
    
    @api_bp.route("/stats/range/<int:range_id>/progress", methods=["GET"])
    def get_range_progress(range_id: int):
        """Get progress for a specific range."""
        # Get all training sessions for this range
        all_sessions = training_service.get_all_sessions()
        range_sessions = [s for s in all_sessions if s.range_id == range_id]
        
        if range_sessions:
            total_sessions = len(range_sessions)
            total_questions = sum(s.total_questions for s in range_sessions)
            correct_answers = sum(s.correct_answers for s in range_sessions)
            avg_score = sum(s.score for s in range_sessions) / len(range_sessions)
            total_time = sum(s.time_spent for s in range_sessions)
        else:
            total_sessions = 0
            total_questions = 0
            correct_answers = 0
            avg_score = 0.0
            total_time = 0
        
        return jsonify({
            "range_id": range_id,
            "total_sessions": total_sessions,
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "avg_score": round(avg_score, 2),
            "total_time_spent": total_time,
            "completion_percentage": round((correct_answers / total_questions * 100) if total_questions > 0 else 0, 2),
        })
    
    @api_bp.route("/stats/history", methods=["GET"])
    def get_training_history():
        """Get training session history."""
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
            "created_at": s.created_at,
        } for s in sessions])
    
    @api_bp.route("/stats/leaderboard", methods=["GET"])
    def get_leaderboard():
        """Get leaderboard based on training performance."""
        all_sessions = training_service.get_all_sessions()
        
        # Group by user
        user_stats = {}
        for session in all_sessions:
            if session.user_id:
                if session.user_id not in user_stats:
                    user_stats[session.user_id] = {
                        "user_id": session.user_id,
                        "total_sessions": 0,
                        "total_score": 0.0,
                        "total_questions": 0,
                        "correct_answers": 0,
                        "total_time": 0,
                    }
                
                user_stats[session.user_id]["total_sessions"] += 1
                user_stats[session.user_id]["total_score"] += session.score
                user_stats[session.user_id]["total_questions"] += session.total_questions
                user_stats[session.user_id]["correct_answers"] += session.correct_answers
                user_stats[session.user_id]["total_time"] += session.time_spent
        
        # Calculate averages and sort
        leaderboard = []
        for user_id, stats in user_stats.items():
            avg_score = stats["total_score"] / stats["total_sessions"] if stats["total_sessions"] > 0 else 0
            accuracy = (stats["correct_answers"] / stats["total_questions"] * 100) if stats["total_questions"] > 0 else 0
            
            # Get username if available
            user = auth_service.get_user_by_id(user_id)
            username = user.username if user else f"User {user_id}"
            
            leaderboard.append({
                "user_id": user_id,
                "username": username,
                "total_sessions": stats["total_sessions"],
                "avg_score": round(avg_score, 2),
                "total_questions": stats["total_questions"],
                "correct_answers": stats["correct_answers"],
                "accuracy": round(accuracy, 2),
                "total_time_spent": stats["total_time"],
            })
        
        # Sort by average score (descending)
        leaderboard.sort(key=lambda x: x["avg_score"], reverse=True)
        
        return jsonify(leaderboard)
    
    @api_bp.route("/stats/export", methods=["GET"])
    def export_stats():
        """Export statistics in specified format."""
        format_type = request.args.get("format", "json")
        
        # Get all statistics
        global_stats = {
            "total_ranges": len(range_service.get_all_ranges()),
            "total_sessions": len(training_service.get_all_sessions()),
        }
        
        if format_type == "csv":
            # Simple CSV format
            csv_data = "metric,value\n"
            for key, value in global_stats.items():
                csv_data += f"{key},{value}\n"
            return csv_data, 200, {"Content-Type": "text/csv"}
        else:
            # Default JSON format
            return jsonify(global_stats)
    
    @api_bp.route("/stats/backup", methods=["GET"])
    def backup_all_data():
        """Backup all data."""
        all_ranges = [r.to_dict() for r in range_service.get_all_ranges()]
        all_sessions = [{
            "id": s.id,
            "user_id": s.user_id,
            "range_id": s.range_id,
            "mode": s.mode,
            "score": s.score,
            "total_questions": s.total_questions,
            "correct_answers": s.correct_answers,
            "time_spent": s.time_spent,
            "created_at": s.created_at,
        } for s in training_service.get_all_sessions()]
        
        return jsonify({
            "ranges": all_ranges,
            "training_sessions": all_sessions,
            "timestamp": request.args.get("timestamp", ""),
        })
    
    # ==================== Training Routes ====================
    @api_bp.route("/training/modes", methods=["GET"])
    def get_training_modes():
        """Get available training modes."""
        modes = [
            {"id": "fill", "name": "Remplir une range", "description": "Comple9ter une grille de range"},
            {"id": "guess", "name": "Deviner une range", "description": "De9terminer si des mains font partie d'une range"},
            {"id": "complete", "name": "Comple9ter une range", "description": "Comple9ter une range partiellement remplie"},
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
        
        # Get user_id from auth if not provided
        user_id = data.get("user_id")
        if user_id is None:
            current_user = auth_service.get_current_user()
            if current_user:
                user_id = current_user.id
        
        session = training_service.create_session(
            user_id=user_id,
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
