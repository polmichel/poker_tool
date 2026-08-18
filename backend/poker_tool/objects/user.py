"""
Immutable user entity (Elegant Objects).
"""


class User:
    """Immutable user entity."""

    def __init__(
        self,
        username: str,
        email: str,
        password_hash: str | None = None,
        user_id: int | None = None,
    ):
        self._username = username
        self._email = email
        self._password_hash = password_hash
        self._id = user_id

    @property
    def id(self) -> int | None:
        """User ID."""
        return self._id

    @property
    def username(self) -> str:
        """Username."""
        return self._username

    @property
    def email(self) -> str:
        """Email."""
        return self._email

    @property
    def password_hash(self) -> str | None:
        """Password hash."""
        return self._password_hash

    def _identity(self):
        """Stable identity: the id once persisted, else the username.

        Using the id alone made two unsaved users compare equal (both have
        id ``None``) and collide in sets; falling back to the username keeps
        unsaved users distinguishable.
        """
        return self._id if self._id is not None else self._username

    def __eq__(self, other: object) -> bool:
        """Equality comparison based on the stable identity."""
        if not isinstance(other, User):
            return False
        return self._identity() == other._identity()

    def __hash__(self) -> int:
        """Hash for use in sets/dicts, consistent with __eq__."""
        return hash(self._identity())

    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            "id": self._id,
            "username": self._username,
            "email": self._email,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'User':
        """Create from dictionary."""
        return cls(
            username=data.get("username", ""),
            email=data.get("email", ""),
            password_hash=data.get("password_hash"),
            user_id=data.get("id"),
        )
