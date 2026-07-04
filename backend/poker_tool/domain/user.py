"""
Domain objects for Users (Elegant Objects principles).
"""
from dataclasses import dataclass
from typing import Optional, Dict


@dataclass(frozen=True)
class User:
    """Immutable representation of a user."""
    id: Optional[int] = None
    username: str = ""
    email: str = ""
    password_hash: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'User':
        """Create a User from dictionary."""
        return cls(
            id=data.get("id"),
            username=data.get("username", ""),
            email=data.get("email", ""),
            password_hash=data.get("password_hash"),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )
