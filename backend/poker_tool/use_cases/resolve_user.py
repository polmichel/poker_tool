"""
Resolve a user (use case).

Encapsulates: resolving a user from an explicit ID, the current authenticated
user, or falling back to the first existing user for anonymous / E2E sessions.
This centralizes the user resolution logic that was previously duplicated in
multiple use cases (CurrentUser, CreateRange, StartTrainingSession).

Dependencies (Users port, Auth port) are injected, making this unit-testable
with fakes.
"""
from ..interfaces.auth import Auth
from ..interfaces.users import Users
from ..objects.user import User
from .errors import UserRequired


class ResolveUser:
    """Resolve a user from various sources with fallback."""

    def __init__(self, users: Users, auth: Auth) -> None:
        """Initialize with Users and Auth ports."""
        self._users = users
        self._auth = auth

    def resolve(self, user_id: int | None = None) -> User | None:
        """Resolve a user from the given ID, auth context, or fallback.

        Priority order:
        1. Explicit user_id (if provided)
        2. Current authenticated user (from JWT)
        3. First existing user (for anonymous / E2E sessions)
        4. None (if no user exists)

        Args:
            user_id: Optional explicit user ID to resolve.

        Returns:
            The resolved User, or None if no user can be found.

        Raises:
            UserRequired: If user_id is explicitly None and no user exists.
        """
        if user_id is not None:
            return self._users.user_by_id(user_id)

        current = self._auth.current_user()
        if current and current.id:
            return self._users.user_by_id(current.id)

        users = self._users.all()
        return users[0] if users else None

    def resolve_or_raise(self, user_id: int | None = None) -> User:
        """Resolve a user, raising UserRequired if none can be found.

        Same as resolve(), but raises UserRequired if the result is None.

        Args:
            user_id: Optional explicit user ID to resolve.

        Returns:
            The resolved User.

        Raises:
            UserRequired: If no user can be resolved.
        """
        user = self.resolve(user_id)
        if not user:
            raise UserRequired()
        return user
