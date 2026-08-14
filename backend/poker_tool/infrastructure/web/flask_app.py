"""
Flask application with routes (Elegant Objects).

This is the infrastructure layer — it only translates HTTP into use-case
calls and use-case results back into HTTP. No business logic lives here.
"""
from flask import Flask, Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest, NotFound
from flask_jwt_extended import jwt_required, get_jwt_identity
from ...interfaces.users import Users
from ...interfaces.ranges import Ranges
from ...interfaces.training_sessions import TrainingSessions
from ...interfaces.auth import Auth
from ...objects.range import Range
from ...objects.user import User
from ...objects.training.session import TrainingSession
from ...use_cases.register_user import RegisterUser, UserAlreadyExists
from ...use_cases.login_user import LoginUser, InvalidCredentials
from ...use_cases.current_user import CurrentUser
from ...use_cases.create_range import CreateRange
from ...use_cases.update_range import UpdateRange, RangeNotFound as UpdateRangeNotFound
from ...use_cases.start_training_session import (
    StartTrainingSession, RangeNotFound as StartRangeNotFound,
    RangeHasNoHands, UserRequired,
)
from ...use_cases.answer_question import AnswerQuestion, SessionNotFound as AnswerSessionNotFound
from ...use_cases.end_training_session import EndTrainingSession, SessionNotFound as EndSessionNotFound
from ...use_cases.global_stats import GlobalStats
from ...use_cases.user_stats import UserStats, UserNotFound


class FlaskApp:
    """Flask application with thin HTTP controllers."""

    def __init__(
        self,
        flask_app: Flask,
        users: Users,
        ranges: Ranges,
        sessions: TrainingSessions,
        auth: Auth,
        register_user: RegisterUser,
        login_user: LoginUser,
        current_user: CurrentUser,
        create_range: CreateRange,
        update_range: UpdateRange,
        start_training: StartTrainingSession,
        answer_question: AnswerQuestion,
        end_training: EndTrainingSession,
        global_stats: GlobalStats,
        user_stats: UserStats,
    ):
        """Initialize the Flask app with its use cases (DI)."""
        self.app = flask_app
        self.users = users
        self.ranges = ranges
        self.sessions = sessions
        self.auth = auth
        self._register_user = register_user
        self._login_user = login_user
        self._current_user = current_user
        self._create_range = create_range
        self._update_range = update_range
        self._start_training = start_training
        self._answer_question = answer_question
        self._end_training = end_training
        self._global_stats = global_stats
        self._user_stats = user_stats
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
            ranges = self.ranges.all()
            return jsonify([r.to_dict() for r in ranges])

        @api.route("/ranges/<int:range_id>", methods=["GET"])
        def get_range(range_id: int):
            range_obj = self.ranges.range_by_id(range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")
            return jsonify(range_obj.to_dict())

        @api.route("/ranges", methods=["POST"])
        def create_range():
            data = request.get_json()
            if not data or "name" not in data:
                raise BadRequest("Missing name")
            saved_range = self._create_range.create(data)
            return jsonify(saved_range.to_dict()), 201

        @api.route("/ranges/<int:range_id>", methods=["PUT"])
        def update_range(range_id: int):
            data = request.get_json()
            if not data:
                raise BadRequest("Missing data")
            try:
                saved_range = self._update_range.update(range_id, data)
            except UpdateRangeNotFound:
                raise NotFound(f"Range {range_id} not found")
            return jsonify(saved_range.to_dict())

        @api.route("/ranges/<int:range_id>", methods=["DELETE"])
        def delete_range(range_id: int):
            range_obj = self.ranges.range_by_id(range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")
            self.ranges.remove(range_obj)
            return jsonify({"message": f"Range {range_id} deleted"}), 200

        @api.route("/ranges/user/<int:user_id>", methods=["GET"])
        def get_user_ranges(user_id: int):
            ranges = self.ranges.ranges_by_user(user_id)
            return jsonify([r.to_dict() for r in ranges])

        @api.route("/ranges/<int:range_id>/grid", methods=["GET"])
        def get_range_grid(range_id: int):
            range_obj = self.ranges.range_by_id(range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")
            return jsonify({"grid": range_obj.grid()})

        @api.route("/ranges/<int:range_id>/stats", methods=["GET"])
        def get_range_stats(range_id: int):
            range_obj = self.ranges.range_by_id(range_id)
            if not range_obj:
                raise NotFound(f"Range {range_id} not found")
            return jsonify(range_obj.statistics())

        # ==================== USER ROUTES ====================

        @api.route("/users", methods=["GET"])
        def get_users():
            users = self.users.all()
            return jsonify([u.to_dict() for u in users])

        @api.route("/users/<int:user_id>", methods=["GET"])
        def get_user(user_id: int):
            user = self.users.user_by_id(user_id)
            if not user:
                raise NotFound(f"User {user_id} not found")
            return jsonify(user.to_dict())

        @api.route("/users", methods=["POST"])
        def create_user():
            data = request.get_json()
            if not data or "username" not in data or "email" not in data or "password" not in data:
                raise BadRequest("Missing required fields: username, email, password")
            user = self.auth.create_user(
                username=data["username"],
                email=data["email"],
                password=data["password"],
            )
            saved_user = self.users.add(user)
            return jsonify(saved_user.to_dict()), 201

        @api.route("/users/login", methods=["POST"])
        def login():
            data = request.get_json()
            if not data or "username" not in data or "password" not in data:
                raise BadRequest("Missing username or password")
            try:
                result = self._login_user.login(data["username"], data["password"])
            except InvalidCredentials as e:
                if "not found" in str(e).lower():
                    raise NotFound("User not found")
                raise BadRequest("Invalid password")
            return jsonify({"token": result.token, "user": result.user.to_dict()})

        # ==================== AUTH ROUTES ====================

        @api.route("/auth/register", methods=["POST"])
        def auth_register():
            data = request.get_json()
            if not data or "username" not in data or "email" not in data or "password" not in data:
                raise BadRequest("Missing required fields: username, email, password")
            try:
                result = self._register_user.register(
                    data["username"], data["email"], data["password"],
                )
            except UserAlreadyExists as e:
                raise BadRequest(str(e))
            return jsonify({"access_token": result.token, "user": result.user.to_dict()}), 201

        @api.route("/auth/login", methods=["POST"])
        def auth_login():
            data = request.get_json()
            if not data or "username" not in data or "password" not in data:
                raise BadRequest("Missing username or password")
            try:
                result = self._login_user.login(data["username"], data["password"])
            except InvalidCredentials as e:
                if "not found" in str(e).lower():
                    raise NotFound("User not found")
                raise BadRequest("Invalid password")
            return jsonify({"access_token": result.token, "user": result.user.to_dict()})

        @api.route("/auth/me", methods=["GET"])
        @jwt_required()
        def auth_me():
            user = self._current_user.user()
            if not user:
                raise NotFound("User not found")
            return jsonify(user.to_dict())

        # ==================== TRAINING ROUTES ====================

        @api.route("/training/sessions", methods=["POST"])
        def create_training_session():
            data = request.get_json()
            if not data or "mode" not in data or "range_id" not in data:
                raise BadRequest("Missing required fields: mode, range_id")
            try:
                result = self._start_training.start(
                    mode=data["mode"],
                    range_id=data["range_id"],
                    total_questions=data.get("total_questions", 10),
                    user_id=data.get("user_id"),
                )
            except StartRangeNotFound:
                raise NotFound(f"Range {data['range_id']} not found")
            except RangeHasNoHands as e:
                raise BadRequest(str(e))
            except UserRequired:
                raise BadRequest("User required")
            session = result.session
            return jsonify({
                "id": session.id,
                "session": session.to_dict(),
                "first_question": session.current_question.to_dict() if session.current_question else None,
            }), 201

        @api.route("/training/sessions", methods=["GET"])
        def list_training_sessions():
            sessions = self.sessions.all()
            return jsonify([s.to_dict() for s in sessions])

        @api.route("/training/sessions/<int:session_id>", methods=["GET"])
        def get_training_session(session_id: int):
            session = self.sessions.session_by_id(session_id)
            if not session:
                raise NotFound(f"Session {session_id} not found")
            return jsonify({
                "id": session.id,
                "session": session.to_dict(),
                "current_question": session.current_question.to_dict() if session.current_question else None,
                "progress": {
                    "current": session.current_index,
                    "total": session.total_questions,
                    "correct": session.correct_answers,
                    "score": session.score,
                },
            })

        @api.route("/training/sessions/<int:session_id>/start", methods=["POST"])
        def start_training_session(session_id: int):
            session = self.sessions.session_by_id(session_id)
            if not session:
                raise NotFound(f"Session {session_id} not found")
            return jsonify({
                "session": session.to_dict(),
                "first_question": session.current_question.to_dict() if session.current_question else None,
            })

        @api.route("/training/modes", methods=["GET"])
        def get_training_modes():
            return jsonify([
                {"value": "fill", "label": "Remplir une range"},
                {"value": "guess", "label": "Deviner une range"},
                {"value": "complete", "label": "Completer une range"},
            ])

        @api.route("/training/sessions/<int:session_id>/next", methods=["POST"])
        def next_question(session_id: int):
            data = request.get_json()
            if not data or "answer" not in data:
                raise BadRequest("Missing answer")
            try:
                result = self._answer_question.answer(session_id, data["answer"])
            except AnswerSessionNotFound:
                raise NotFound(f"Session {session_id} not found")
            return jsonify(result.response)

        @api.route("/training/sessions/<int:session_id>/end", methods=["POST"])
        def end_training_session(session_id: int):
            try:
                result = self._end_training.end(session_id)
            except EndSessionNotFound:
                raise NotFound(f"Session {session_id} not found")
            return jsonify({"message": "Session ended", "session": result.session.to_dict()})

        @api.route("/training/sessions/user/<int:user_id>", methods=["GET"])
        def get_user_sessions(user_id: int):
            sessions = self.sessions.sessions_by_user(user_id)
            return jsonify([s.to_dict() for s in sessions])

        # ==================== STATS ROUTES ====================

        @api.route("/stats/global", methods=["GET"])
        def get_global_stats():
            return jsonify(self._global_stats.compute())

        @api.route("/stats/user/<int:user_id>", methods=["GET"])
        def get_user_stats(user_id: int):
            try:
                return jsonify(self._user_stats.compute(user_id))
            except UserNotFound:
                raise NotFound(f"User {user_id} not found")

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
