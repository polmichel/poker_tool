"""
Flask application composition (Elegant Objects).

This is the infrastructure layer — it only composes the HTTP controllers
and delegates every business operation to the injected use cases. No
business logic lives here.
"""
from flask import Blueprint, Flask, jsonify
from werkzeug.exceptions import BadRequest, NotFound

from ...interfaces.auth import Auth
from ...config import Config
from ...interfaces.equity_calculator import EquityCalculator
from ...interfaces.ranges import Ranges
from ...interfaces.training_sessions import TrainingSessions
from ...interfaces.users import Users
from ...use_cases.answer_question import AnswerQuestion
from ...use_cases.create_range import CreateRange
from ...use_cases.current_user import CurrentUser
from ...use_cases.end_training_session import EndTrainingSession
from ...use_cases.global_stats import GlobalStats
from ...use_cases.login_user import LoginUser
from ...use_cases.register_user import RegisterUser
from ...use_cases.start_training_session import StartTrainingSession
from ...use_cases.update_range import UpdateRange
from ...use_cases.user_stats import UserStats
from .controllers.auth import AuthController, UserController
from .controllers.donations import DonationController
from .controllers.equity import EquityController
from .controllers.ranges import RangeController
from .controllers.stats import StatsController
from .controllers.training import TrainingController


class FlaskApp:
    """Flask application that composes thin HTTP controllers."""

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
        table_equity: EquityCalculator,
        monte_carlo_equity: EquityCalculator,
        config: Config,
    ):
        """Initialize the Flask app with its use cases (DI)."""
        self.app = flask_app
        self.users = users
        self.ranges = ranges
        self.sessions = sessions
        self.auth = auth
        self.config = config

        # Build the controllers (each owns a resource's routes).
        self._controllers = [
            RangeController(ranges, auth, create_range, update_range),
            UserController(users, auth),
            AuthController(register_user, login_user, current_user),
            TrainingController(sessions, start_training, answer_question, end_training),
            StatsController(global_stats, user_stats),
            EquityController(table_equity, monte_carlo_equity),
            DonationController(config),
        ]
        self._register_routes()

    def _register_routes(self) -> None:
        """Register all routes via the controllers."""
        api = Blueprint("api", __name__, url_prefix="/api")

        @api.route("/health")
        def health():
            return jsonify({"status": "healthy", "version": "1.0.0"})

        for controller in self._controllers:
            controller.register(api)

        self.app.register_blueprint(api)

        # Return JSON for all HTTP exceptions (BadRequest, NotFound, etc.)
        # so the frontend can read error.message from response.data.error
        # instead of getting an HTML error page.
        @self.app.errorhandler(BadRequest)
        @self.app.errorhandler(NotFound)
        def handle_http_error(e):
            return jsonify({"error": e.description}), e.code

        @self.app.errorhandler(500)
        def handle_internal_error(e):
            return jsonify({"error": "Internal server error"}), 500

        @self.app.route("/")
        def home():
            return jsonify({
                "message": "Welcome to Poker Tool API",
                "version": "1.0.0",
                "docs": "/api/health",
            })
