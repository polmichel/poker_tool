"""
Main application composer (Elegant Objects).

This is the composition root: it constructs every object and wires its
dependencies. Nothing else in the codebase reads the environment or decides
which concrete adapter or use case to use.
"""
from flask import Flask
from flask_cors import CORS

from .adapters.jwt.auth import JwtAuth
from .adapters.sqlalchemy.ranges import SqlRanges
from .adapters.sqlalchemy.training_sessions import SqlTrainingSessions
from .adapters.sqlalchemy.users import SqlUsers
from .config import Config
from .infrastructure.web.flask_app import FlaskApp
from .use_cases.answer_question import AnswerQuestion
from .use_cases.create_range import CreateRange
from .use_cases.current_user import CurrentUser
from .use_cases.end_training_session import EndTrainingSession
from .use_cases.global_stats import GlobalStats
from .use_cases.login_user import LoginUser
from .use_cases.register_user import RegisterUser
from .use_cases.start_training_session import StartTrainingSession
from .use_cases.update_range import UpdateRange
from .use_cases.user_stats import UserStats


class PokerTool:
    """Main application composer."""

    def __init__(self, config: Config = None) -> None:
        """Compose the application from its dependencies."""
        self.config = config if config is not None else Config()

        # Create Flask app
        self.app = Flask(__name__)

        # Configure Flask from the injected Config
        self._configure_flask()

        # Create adapters (concrete implementations of the ports)
        self.users = SqlUsers(self.app)
        self.ranges = SqlRanges(self.app)
        self.sessions = SqlTrainingSessions(self.app)
        self.auth = JwtAuth(self.app, self.config)

        # Create use cases (each receives its dependencies via constructor)
        self.register_user = RegisterUser(self.users, self.auth)
        self.login_user = LoginUser(self.users, self.auth)
        self.current_user = CurrentUser(self.users, self.auth)
        self.create_range = CreateRange(self.ranges, self.auth)
        self.update_range = UpdateRange(self.ranges)
        self.start_training = StartTrainingSession(
            self.ranges, self.users, self.sessions, self.auth,
        )
        self.answer_question = AnswerQuestion(self.sessions)
        self.end_training = EndTrainingSession(self.sessions)
        self.global_stats = GlobalStats(self.ranges, self.users, self.sessions)
        self.user_stats = UserStats(self.users, self.ranges, self.sessions)

        # Create the web layer (thin controllers delegating to use cases)
        self.flask_app = FlaskApp(
            flask_app=self.app,
            users=self.users,
            ranges=self.ranges,
            sessions=self.sessions,
            auth=self.auth,
            register_user=self.register_user,
            login_user=self.login_user,
            current_user=self.current_user,
            create_range=self.create_range,
            update_range=self.update_range,
            start_training=self.start_training,
            answer_question=self.answer_question,
            end_training=self.end_training,
            global_stats=self.global_stats,
            user_stats=self.user_stats,
        )

    def _configure_flask(self) -> None:
        """Configure Flask from the injected Config."""
        self.app.config["SECRET_KEY"] = self.config.secret_key
        self.app.config["SQLALCHEMY_DATABASE_URI"] = self.config.database_uri
        self.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        # Ensure the instance folder exists so SQLite can write to it.
        import os
        os.makedirs(self.app.instance_path, exist_ok=True)
        # Accept both "/api/ranges" and "/api/ranges/" (the frontend uses
        # trailing slashes). Avoids 404s from strict_slashes default behavior.
        self.app.url_map.strict_slashes = False
        CORS(self.app, resources={r"/*": {"origins": self.config.cors_origins}})

    def run(self, host: str = "0.0.0.0", port: int = 5000, debug: bool = True) -> None:
        """Run the application."""
        with self.app.app_context():
            self.users.db.create_all()
        self.app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    PokerTool().run()
