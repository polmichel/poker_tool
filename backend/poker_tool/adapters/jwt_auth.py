"""
JWT Auth Adapter (Elegant Objects principles).
Concrete implementation of AuthPort using Flask-JWT-Extended.
"""
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from typing import Optional, Any
from ..ports.auth import AuthPort


class JWTAuth(AuthPort):
    """JWT implementation of AuthPort."""
    
    def __init__(self, app: Any = None, secret_key: str = None):
        """Initialize the JWT auth adapter."""
        self.jwt = JWTManager()
        self.secret_key = secret_key or "poker_tool_jwt_secret_12345"
        if app:
            self.init_app(app)
    
    def init_app(self, app: Any) -> None:
        """Initialize the auth service with the Flask app."""
        app.config["JWT_SECRET_KEY"] = self.secret_key
        app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 hours
        self.jwt.init_app(app)
    
    def create_access_token(self, identity: Any) -> str:
        """Create an access token for a user."""
        return create_access_token(identity=identity)
    
    def get_current_user_id(self) -> Optional[int]:
        """Get the current user ID from the JWT token."""
        try:
            return int(get_jwt_identity())
        except Exception:
            return None
    
    def verify_password(self, password_hash: str, password: str) -> bool:
        """Verify a password against its hash."""
        return check_password_hash(password_hash, password)
    
    def generate_password_hash(self, password: str) -> str:
        """Generate a password hash."""
        return generate_password_hash(password)
