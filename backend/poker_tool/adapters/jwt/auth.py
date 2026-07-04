"""
JWT implementation of the Auth interface (Elegant Objects).
"""
from typing import Optional
from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash
from ...interfaces.auth import Auth
from ...objects.user import User


class JwtAuth(Auth):
    """JWT implementation of Auth interface."""

    def __init__(self, app: Flask):
        """Initialize the JWT auth adapter."""
        self.app = app
        self.jwt = JWTManager(app)
        self._configure_jwt()

    def _configure_jwt(self) -> None:
        """Configure JWT settings."""
        self.app.config["JWT_SECRET_KEY"] = "poker_tool_jwt_secret_key"
        self.app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # 1 hour

    def create_user(self, username: str, email: str, password: str) -> User:
        """Create a new user with hashed password."""
        password_hash = generate_password_hash(password)
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
        )
        return user

    def authenticate(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user (to be used with storage)."""
        # This method is a placeholder - actual authentication happens in the route
        # with the help of storage to fetch the user
        return None

    def current_user(self) -> Optional[User]:
        """Get the current authenticated user from JWT."""
        try:
            user_id = get_jwt_identity()
            if user_id:
                # In a real implementation, we would fetch the user from storage
                # For now, return a dummy user (will be replaced by actual user from storage)
                return User(username="", email="", user_id=user_id)
        except Exception:
            return None

    def generate_token(self, user: User) -> str:
        """Generate a JWT access token for a user."""
        if user.id:
            return create_access_token(identity=user.id)
        raise ValueError("Cannot generate token for user without ID")

    def verify_token(self, token: str) -> Optional[User]:
        """Verify a JWT token and return the user."""
        try:
            # This is a simplified implementation
            # In a real scenario, we would decode the token and fetch the user from storage
            from flask_jwt_extended import decode_token
            decoded = decode_token(token)
            user_id = decoded["sub"]
            return User(username="", email="", user_id=user_id)
        except Exception:
            return None

    def hash_password(self, password: str) -> str:
        """Hash a password."""
        return generate_password_hash(password)

    def check_password(self, password: str, password_hash: str) -> bool:
        """Check if a password matches its hash."""
        return check_password_hash(password_hash, password)
