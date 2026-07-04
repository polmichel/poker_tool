"""
Flask application with routes (Elegant Objects).
This is the infrastructure layer - it only composes objects and delegates to them.
"""
from flask import Flask, Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest, NotFound
from ...interfaces.storage import Storage
from ...interfaces.auth import Auth
from ...objects.range import Range
from ...objects.user import User
from ...objects.training.session import TrainingSession
from ...objects.training.question import TrainingQuestion


class FlaskApp:
    """Flask application with routes."""

    def __init__(self, flask_app: Flask, storage: Storage, auth: Auth):
        """Initialize the Flask app with dependencies."""
        self.app = flask_app
        self.storage = storage
        self.auth = auth
        self._register_routes()

    def _register_routes(self) -> None:
        """Register all routes."""
        api = Blueprint("api", __name__, url_prefix="/api")

        # Health check
        @api.route("/health")
        def health():
            return jsonify({"status": "healthy", "version": "1.0.0"})

        # ==================== RANGE ROUTES ====================

        @api.route("/ranges", methods=["GET"])
        def get_ranges():
            """Get all ranges."""
            ranges = self.storage.all(Range)
            return jsonify([r.to_dict() for r in ranges])

        @api.route("/ranges/<int:range_id>", methods=["GET"])
        def get_range(range_id: int):
            """Get a specific range by ID."""
            range_obj = self.storage.get(Range, range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")
            return jsonify(range_obj.to_dict())

        @api.route("/ranges", methods=["POST"])
        def create_range():
            """Create a new range."""
            data = request.get_json()
            if not data or "name" not in data:
                raise BadRequest("Missing name")

            # Get user from auth
            user_id = data.get("user_id")
            if not user_id:
                current_user = self.auth.current_user()
                if current_user:
                    user_id = current_user.id

            # Create range from dictionary
            range_obj = Range.from_dict({
                **data,
                "user_id": user_id,
            })

            # Save range
            saved_range = self.storage.save(range_obj)
            return jsonify(saved_range.to_dict()), 201

        @api.route("/ranges/<int:range_id>", methods=["PUT"])
        def update_range(range_id: int):
            """Update an existing range."""
            data = request.get_json()
            if not data:
                raise BadRequest("Missing data")

            range_obj = self.storage.get(Range, range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")

            # Create updated range (immutable)
            updated_range = Range.from_dict({
                **range_obj.to_dict(),
                **data,
            })

            saved_range = self.storage.save(updated_range)
            return jsonify(saved_range.to_dict())

        @api.route("/ranges/<int:range_id>", methods=["DELETE"])
        def delete_range(range_id: int):
            """Delete a range."""
            range_obj = self.storage.get(Range, range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")

            self.storage.remove(range_obj)
            return jsonify({"message": f"Range {range_id} deleted"}), 200

        @api.route("/ranges/user/<int:user_id>", methods=["GET"])
        def get_user_ranges(user_id: int):
            """Get all ranges for a user."""
            ranges = self.storage.ranges_by_user(user_id)
            return jsonify([r.to_dict() for r in ranges])

        @api.route("/ranges/<int:range_id>/grid", methods=["GET"])
        def get_range_grid(range_id: int):
            """Get the grid representation of a range."""
            range_obj = self.storage.get(Range, range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")

            grid = range_obj.grid()
            return jsonify({"grid": grid})

        @api.route("/ranges/<int:range_id>/stats", methods=["GET"])
        def get_range_stats(range_id: int):
            """Get statistics for a range."""
            range_obj = self.storage.get(Range, range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")

            stats = range_obj.statistics()
            return jsonify(stats)

        # ==================== USER ROUTES ====================

        @api.route("/users", methods=["GET"])
        def get_users():
            """Get all users."""
            users = self.storage.all(User)
            return jsonify([u.to_dict() for u in users])

        @api.route("/users/<int:user_id>", methods=["GET"])
        def get_user(user_id: int):
            """Get a specific user by ID."""
            user = self.storage.get(User, user_id)
            if not user:
                raise NotFound(f"User {user_id} not found")
            return jsonify(user.to_dict())

        @api.route("/users", methods=["POST"])
        def create_user():
            """Create a new user."""
            data = request.get_json()
            if not data or "username" not in data or "email" not in data or "password" not in data:
                raise BadRequest("Missing required fields: username, email, password")

            # Create user with hashed password
            user = self.auth.create_user(
                username=data["username"],
                email=data["email"],
                password=data["password"],
            )

            # Save user
            saved_user = self.storage.save(user)
            return jsonify(saved_user.to_dict()), 201

        @api.route("/users/login", methods=["POST"])
        def login():
            """Authenticate a user and return a token."""
            data = request.get_json()
            if not data or "username" not in data or "password" not in data:
                raise BadRequest("Missing username or password")

            # Get user by username
            user = self.storage.user_by_username(data["username"])
            if not user:
                raise NotFound("User not found")

            # Check password
            if not self.auth.check_password(data["password"], user.password_hash):
                raise BadRequest("Invalid password")

            # Generate token
            token = self.auth.generate_token(user)
            return jsonify({
                "token": token,
                "user": user.to_dict(),
            })

        # ==================== TRAINING ROUTES ====================

        @api.route("/training/sessions", methods=["POST"])
        def create_training_session():
            """Create a new training session."""
            data = request.get_json()
            if not data or "mode" not in data or "range_id" not in data:
                raise BadRequest("Missing required fields: mode, range_id")

            # Get range
            range_obj = self.storage.get(Range, data["range_id"])
            if not range_obj:
                raise NotFound(f"Range {data['range_id']} not found")

            # Check if range has hands
            if not range_obj.hands or len(range_obj.hands) == 0:
                raise BadRequest(f"Range {data['range_id']} has no hands. Please add hands to your range before starting a training session.")

            # Get user
            user_id = data.get("user_id")
            if not user_id:
                current_user = self.auth.current_user()
                if current_user:
                    user_id = current_user.id

            user = self.storage.get(User, user_id) if user_id else None
            if not user:
                raise BadRequest("User required")

            # Create training session
            session = TrainingSession(
                user=user,
                range_obj=range_obj,
                mode=data["mode"],
                total_questions=data.get("total_questions", 10),
            )

            # Save session
            saved_session = self.storage.save(session)
            return jsonify({
                "session": saved_session.to_dict(),
                "first_question": saved_session.current_question.to_dict() if saved_session.current_question else None,
            }), 201

        @api.route("/training/sessions/<int:session_id>", methods=["GET"])
        def get_training_session(session_id: int):
            """Get a training session by ID."""
            session = self.storage.get(TrainingSession, session_id)
            if not session:
                raise NotFound(f"Session {session_id} not found")
            return jsonify(session.to_dict())

        @api.route("/training/sessions/<int:session_id>/next", methods=["POST"])
        def next_question(session_id: int):
            """Submit an answer and get the next question."""
            data = request.get_json()
            if not data or "answer" not in data:
                raise BadRequest("Missing answer")

            session = self.storage.get(TrainingSession, session_id)
            if not session:
                raise NotFound(f"Session {session_id} not found")

            # Answer the current question (immutable)
            new_session = session.answer(data["answer"])
            saved_session = self.storage.save(new_session)

            response = {
                "is_correct": new_session.current_index > session.current_index and
                            new_session.correct_answers > session.correct_answers,
                "correct_answer": session.current_question.correct_answer if session.current_question else None,
                "session_complete": new_session.is_complete,
                "progress": {
                    "current": new_session.current_index,
                    "total": new_session.total_questions,
                    "correct": new_session.correct_answers,
                    "score": new_session.score,
                },
            }

            if new_session.current_question:
                response["next_question"] = new_session.current_question.to_dict()

            return jsonify(response)

        @api.route("/training/sessions/<int:session_id>/end", methods=["POST"])
        def end_training_session(session_id: int):
            """End a training session."""
            session = self.storage.get(TrainingSession, session_id)
            if not session:
                raise NotFound(f"Session {session_id} not found")

            # End the session (immutable)
            ended_session = session.end()
            saved_session = self.storage.save(ended_session)

            return jsonify({
                "message": "Session ended",
                "session": saved_session.to_dict(),
            })

        @api.route("/training/sessions/user/<int:user_id>", methods=["GET"])
        def get_user_sessions(user_id: int):
            """Get all training sessions for a user."""
            sessions = self.storage.sessions_by_user(user_id)
            return jsonify([s.to_dict() for s in sessions])

        # ==================== STATS ROUTES ====================

        @api.route("/stats/global", methods=["GET"])
        def get_global_stats():
            """Get global statistics."""
            ranges = self.storage.all(Range)
            users = self.storage.all(User)
            sessions = self.storage.all(TrainingSession)

            # Calculate global stats
            total_hands = sum(len(r.hands) for r in ranges)
            total_sessions = len(sessions)
            avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0.0

            # Find most common action
            action_counts = {}
            for r in ranges:
                for action in r.hands.values():
                    action_name = action.type.name
                    action_counts[action_name] = action_counts.get(action_name, 0) + 1

            most_common_action = max(action_counts.items(), key=lambda x: x[1])[0] if action_counts else "UNDEFINED"

            return jsonify({
                "total_ranges": len(ranges),
                "total_users": len(users),
                "total_sessions": total_sessions,
                "total_hands": total_hands,
                "avg_score": round(avg_score, 2),
                "most_common_action": most_common_action,
            })

        @api.route("/stats/user/<int:user_id>", methods=["GET"])
        def get_user_stats(user_id: int):
            """Get statistics for a specific user."""
            user = self.storage.get(User, user_id)
            if not user:
                raise NotFound(f"User {user_id} not found")

            sessions = self.storage.sessions_by_user(user_id)
            ranges = self.storage.ranges_by_user(user_id)

            total_sessions = len(sessions)
            avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0.0
            total_time_spent = sum(s.time_spent for s in sessions)
            best_score = max((s.score for s in sessions), default=0.0)
            most_played_range = max(ranges, key=lambda r: len(r.hands)).name if ranges else ""

            return jsonify({
                "user_id": user_id,
                "total_sessions": total_sessions,
                "avg_score": round(avg_score, 2),
                "total_time_spent": total_time_spent,
                "best_score": round(best_score, 2),
                "most_played_range": most_played_range,
            })

        # Register the API blueprint
        self.app.register_blueprint(api)

        # Home route
        @self.app.route("/")
        def home():
            return jsonify({
                "message": "Welcome to Poker Tool API",
                "version": "1.0.0",
                "docs": "/api/health",
            })
