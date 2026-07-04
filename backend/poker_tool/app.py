"""
Poker Tool Application (Elegant Objects principles).
Composes the application using dependency injection.
"""
from flask import Flask
from flask_cors import CORS
from .adapters.sqlalchemy_db import SQLAlchemyDatabase
from .adapters.jwt_auth import JWTAuth
from .services.range_service import RangeService
from .services.auth_service import AuthService
from .services.training_service import TrainingService
from .web.routes import register_routes


class PokerToolApp:
    """Main application class that composes all dependencies."""
    
    def __init__(self):
        """Initialize the application with all dependencies."""
        # Create Flask app
        self.app = Flask(__name__)
        
        # Configure Flask
        self._configure_flask()
        
        # Initialize dependencies
        self.database = SQLAlchemyDatabase(self.app)
        self.auth = JWTAuth(self.app)
        
        # Initialize services with injected dependencies
        self.range_service = RangeService(self.database)
        self.auth_service = AuthService(self.database, self.auth)
        self.training_service = TrainingService(self.database)
        
        # Register routes with injected services
        register_routes(
            self.app,
            self.range_service,
            self.auth_service,
            self.training_service,
        )
    
    def _configure_flask(self) -> None:
        """Configure Flask application."""
        self.app.config["SECRET_KEY"] = "poker_tool_secret_key_12345"
        self.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///poker_tool.db"
        self.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        
        # Initialize CORS
        CORS(self.app, resources={r"/*": {"origins": "*"}})
    
    def run(self, host: str = "0.0.0.0", port: int = 5000, debug: bool = True) -> None:
        """Run the Flask application."""
        # Create tables
        with self.app.app_context():
            self.database.create_all()
        
        self.app.run(host=host, port=port, debug=debug)


# Factory function to create the application
def create_app() -> PokerToolApp:
    """Factory function to create and return the application."""
    return PokerToolApp()


# For backward compatibility
app = create_app().app


if __name__ == "__main__":
    poker_app = create_app()
    poker_app.run()
