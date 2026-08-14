"""
Main application composer (Elegant Objects).

This is the composition root: it constructs every object and wires its
dependencies. Nothing else in the codebase reads the environment or decides
which concrete adapter to use.
"""
from flask import Flask
from flask_cors import CORS
from .config import Config
from .adapters.sqlalchemy.storage import SqlAlchemyStorage
from .adapters.jwt.auth import JwtAuth
from .infrastructure.web.flask_app import FlaskApp


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
        self.storage = SqlAlchemyStorage(self.app)
        self.auth = JwtAuth(self.app, self.config)

        # Create the web layer
        self.flask_app = FlaskApp(
            flask_app=self.app,
            storage=self.storage,
            auth=self.auth,
        )

    def _configure_flask(self) -> None:
        """Configure Flask from the injected Config."""
        self.app.config["SECRET_KEY"] = self.config.secret_key
        self.app.config["SQLALCHEMY_DATABASE_URI"] = self.config.database_uri
        self.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        # Accept both "/api/ranges" and "/api/ranges/" (the frontend uses
        # trailing slashes). Avoids 404s from strict_slashes default behavior.
        self.app.url_map.strict_slashes = False
        CORS(self.app, resources={r"/*": {"origins": self.config.cors_origins}})

    def run(self, host: str = "0.0.0.0", port: int = 5000, debug: bool = True) -> None:
        """Run the application."""
        with self.app.app_context():
            self.storage.db.create_all()
        self.app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    PokerTool().run()
