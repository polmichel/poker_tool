"""
Resolve the current user (use case).

Encapsulates: turning a JWT identity into a real User, with the fallback to
the first existing user for anonymous / E2E sessions. This is now a thin
wrapper around ResolveUser for backward compatibility.

Dependencies (Users port, Auth port) are injected.
"""

from .resolve_user import ResolveUser


class CurrentUser:
    """Resolve the authenticated (or fallback) user.
    
    This class is kept for backward compatibility but delegates to ResolveUser.
    For new code, prefer using ResolveUser directly.
    """

    def __init__(self, users, auth) -> None:
        self._resolve_user = ResolveUser(users, auth)

    def user(self) -> object | None:
        """Return the current user, or the first existing user as fallback."""
        return self._resolve_user.resolve()
