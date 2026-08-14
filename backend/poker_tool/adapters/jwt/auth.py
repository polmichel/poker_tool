"""
JWT implementation of the Auth interface (Elegant Objects).
"""

from flask import Flask
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    decode_token,
    get_jwt_identity,
)
from werkzeug.security import check_password_hash, generate_password_hash

from ...interfaces.auth import Auth
from ...objects.user import User


class JwtAuth(Auth):
    """JWT implementation of Auth interface."""

    def __init__(self, app: Flask, config=None) -> None:
        """Initialize the JWT auth adapter.

        The JWT secret and token lifetime are taken from the injected
        ``Config`` instead of being hard-coded.
        """
        self.app = app
        # Config is optional only to preserve backwards compatibility with
        # ad-hoc usages; the composition root always provides one.
        self.jwt = JWTManager(app)
        self._configure_jwt(config)

    def _configure_jwt(self, config=None) -> None:
        """Configure JWT settings from the injected Config."""
        if config is not None:
            self.app.config["JWT_SECRET_KEY"] = config.jwt_secret_key
            self.app.config["JWT_ACCESS_TOKEN_EXPIRES"] = config.jwt_access_token_expires_seconds
        else:
            self.app.config["JWT_SECRET_KEY"] = "poker_tool_dev_jwt_secret_key"
            self.app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600

    def create_user(self, username: str, email: str, password: str) -> User:
        """Create a new user with hashed password."""
        password_hash = generate_password_hash(password)
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
        )
        return user

    def authenticate(self, username: str, password: str) -> User | None:
        """Authenticate a user (to be used with storage)."""
        # This method is a placeholder - actual authentication happens in the route
        # with the help of storage to fetch the user
        return None

    def current_user(self) -> User | None:
        """Get the current authenticated user from JWT."""
        try:
            user_id = get_jwt_identity()
            if user_id:
                # flask-jwt-extended v4 requires string subjects
                try:
                    user_id = int(user_id)
                except (TypeError, ValueError):
                    pass
                return User(username="", email="", user_id=user_id)
        except Exception:  # noqa: BLE001 - JWT errors are expected; return None
            return None

    def generate_token(self, user: User) -> str:
        """Generate a JWT access token for a user."""
        if user.id:
            return create_access_token(identity=str(user.id))
        raise ValueError("Cannot generate token for user without ID")

    def verify_token(self, token: str) -> User | None:
        """Verify a JWT token and return the user."""
        try:
            # This is a simplified implementation
            # In a real scenario, we would decode the token and fetch the user from storage
            decoded = decode_token(token)
            user_id = decoded["sub"]
            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                pass
            return User(username="", email="", user_id=user_id)
        except Exception:  # noqa: BLE001 - token decode errors are expected
            return None

    def hash_password(self, password: str) -> str:
        """Hash a password."""
        return generate_password_hash(password)

    def check_password(self, password: str, password_hash: str) -> bool:
        """Check if a password matches its hash."""
        return check_password_hash(password_hash, password)
