"""Resolve the current user (use case).

Encapsulates: turning a JWT identity into a real User. This is now a thin
wrapper around ResolveUser for backward compatibility.
Dependencies (Users port, Auth port) are injected.
"""

from ..interfaces.auth import Auth
from ..interfaces.users import Users
from ..objects.user import User
from .resolve_user import ResolveUser


class CurrentUser:
    """Resolve the authenticated user.

    This class is kept for backward compatibility but delegates to ResolveUser.
    For new code, prefer using ResolveUser directly.
    """

    def __init__(self, users: Users, auth: Auth) -> None:
        self._resolve_user = ResolveUser(users, auth)

    def user(self) -> User | None:
        """Return the current authenticated user, or None if not authenticated."""
        return self._resolve_user.resolve()
