"""
Immutable user entity (Elegant Objects).
"""
from typing import Optional


class User:
    """Immutable user entity."""

    def __init__(
        self,
        username: str,
        email: str,
        password_hash: Optional[str] = None,
        user_id: Optional[int] = None,
    ):
        self._username = username
        self._email = email
        self._password_hash = password_hash
        self._id = user_id

    @property
    def id(self) -> Optional[int]:
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
    def password_hash(self) -> Optional[str]:
        """Password hash."""
        return self._password_hash

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, User):
            return False
        return self._id == other._id

    def __hash__(self) -> int:
        """Hash for use in sets/dicts."""
        return hash(self._id)

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
