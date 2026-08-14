"""
Login a user (use case).

Encapsulates: user lookup by username, password verification and token
generation. Dependencies (Users port, Auth port) are injected.
"""
from ..interfaces.auth import Auth
from ..interfaces.users import Users
from ..objects.user import User


class InvalidCredentials(Exception):
    """Raised when the username is unknown or the password is wrong."""


class LoggedInUser:
    """Result of a successful login: the user and its token."""

    def __init__(self, user: User, token: str) -> None:
        self.user = user
        self.token = token


class LoginUser:
    """Authenticate a user and return a token."""

    def __init__(self, users: Users, auth: Auth) -> None:
        self._users = users
        self._auth = auth

    def login(self, username: str, password: str) -> LoggedInUser:
        user = self._users.user_by_username(username)
        if not user:
            raise InvalidCredentials("User not found")
        if not self._auth.check_password(password, user.password_hash):
            raise InvalidCredentials("Invalid password")
        token = self._auth.generate_token(user)
        return LoggedInUser(user, token)
