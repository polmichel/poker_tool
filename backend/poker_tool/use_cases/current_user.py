"""
Current user use case (legacy).

This class is kept for backward compatibility but delegates to ResolveUser.
For new code, prefer using ResolveUser directly.
"""
from ..interfaces.users import Users
from ..objects.user import User
from .resolve_user import ResolveUser


class CurrentUser:
    """Resolve the authenticated (or fallback) user.

    This class is kept for backward compatibility but delegates to ResolveUser.
    For new code, prefer using ResolveUser directly.
    """

    def __init__(self, users: Users, resolve_user: ResolveUser) -> None:
        self._resolve_user = resolve_user

    def get(self) -> User:
        """Return the current authenticated user, or a fallback if none."""
        return self._resolve_user.resolve()
