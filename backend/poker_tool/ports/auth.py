"""
Auth Port Interface (Elegant Objects principles).
This is an abstraction layer for authentication operations.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from ..domain.user import User


class AuthPort(ABC):
    """Abstract interface for authentication operations."""
    
    @abstractmethod
    def init_app(self, app: Any) -> None:
        """Initialize the auth service with the Flask app."""
        pass
    
    @abstractmethod
    def create_access_token(self, identity: Any) -> str:
        """Create an access token for a user."""
        pass
    
    @abstractmethod
    def get_current_user_id(self) -> Optional[int]:
        """Get the current user ID from the JWT token."""
        pass
    
    @abstractmethod
    def verify_password(self, password_hash: str, password: str) -> bool:
        """Verify a password against its hash."""
        pass
    
    @abstractmethod
    def generate_password_hash(self, password: str) -> str:
        """Generate a password hash."""
        pass
