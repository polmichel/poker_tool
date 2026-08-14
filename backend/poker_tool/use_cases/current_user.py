"""
Resolve the current user (use case).

Encapsulates: turning a JWT identity into a real User, with the fallback to
the first existing user for anonymous / E2E sessions. Dependencies (Users
port, Auth port) are injected.
"""

from ..interfaces.auth import Auth
from ..interfaces.users import Users
from ..objects.user import User


class CurrentUser:
    """Resolve the authenticated (or fallback) user."""

    def __init__(self, users: Users, auth: Auth) -> None:
        self._users = users
        self._auth = auth

    def user(self) -> User | None:
        """Return the current user, or the first existing user as fallback."""
        current = self._auth.current_user()
        if current:
            user = self._users.user_by_id(current.id) if current.id else None
            if user:
                return user
        # Fall back to the first user (anonymous / E2E sessions).
        users = self._users.all()
        return users[0] if users else None
