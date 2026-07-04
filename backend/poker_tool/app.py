"""
Main application composer (Elegant Objects).
This is the entry point that composes all objects and dependencies.
"""
from flask import Flask
from flask_cors import CORS
from .adapters.sqlalchemy.storage import SqlAlchemyStorage
from .adapters.jwt.auth import JwtAuth
from .infrastructure.web.flask_app import FlaskApp


class PokerTool:
    """Main application composer."""

    def __init__(self):
        """Compose the application."""
        # Create Flask app
        self.app = Flask(__name__)

        # Configure Flask
        self._configure_flask()

        # Create storage adapter
        self.storage = SqlAlchemyStorage(self.app)

        # Create auth adapter
        self.auth = JwtAuth(self.app)

        # Create Flask app wrapper
        self.flask_app = FlaskApp(
            flask_app=self.app,
            storage=self.storage,
            auth=self.auth,
        )

    def _configure_flask(self) -> None:
        """Configure Flask."""
        self.app.config["SECRET_KEY"] = "poker_tool_secret_key"
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///poker_tool.db"
        self.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        CORS(self.app, resources={r"/*": {"origins": "*"}})

    def run(self, host: str = "0.0.0.0", port: int = 5000, debug: bool = True) -> None:
        """Run the application."""
        with self.app.app_context():
            self.storage.db.create_all()
        self.app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    app = PokerTool()
    app.run()
