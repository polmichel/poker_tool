"""
Register a new user (use case).

Encapsulates: uniqueness check, user creation (password hash), persistence
and token generation. Dependencies (Users port, Auth port) are injected,
so this is unit-testable with fakes.
"""
from ..interfaces.auth import Auth
from ..interfaces.users import Users
from ..objects.user import User
from .errors import UserAlreadyExists


class RegisteredUser:
    """Result of a successful registration: the stored user and its token."""

    def __init__(self, user: User, token: str) -> None:
        self.user = user
        self.token = token


class RegisterUser:
    """Register a new user and return a token."""

    def __init__(self, users: Users, auth: Auth) -> None:
        self._users = users
        self._auth = auth

    def register(self, username: str, email: str, password: str) -> RegisteredUser:
        if self._users.user_by_username(username):
            raise UserAlreadyExists("Username already exists")
        if self._users.user_by_email(email):
            raise UserAlreadyExists("Email already exists")

        user = self._auth.create_user(username=username, email=email, password=password)
        saved_user = self._users.add(user)
        token = self._auth.generate_token(saved_user)
        return RegisteredUser(saved_user, token)
