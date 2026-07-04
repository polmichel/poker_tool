"""
Auth Service (Elegant Objects principles).
Orchestrates authentication use cases using injected dependencies.
"""
from typing import Optional, Dict, Tuple
from ..domain.user import User
from ..ports.database import DatabasePort
from ..ports.auth import AuthPort


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, database: DatabasePort, auth: AuthPort):
        """Inject database and auth dependencies."""
        self.database = database
        self.auth = auth
    
    def register_user(
        self,
        username: str,
        email: str,
        password: str,
    ) -> Tuple[bool, Optional[User], str]:
        """
        Register a new user.
        Returns: (success, user, error_message)
        """
        # Check if username already exists
        existing_user = self.database.get_user_by_username(username)
        if existing_user:
            return False, None, "Username already exists"
        
        # Check if email already exists
        existing_email = self.database.get_user_by_email(email)
        if existing_email:
            return False, None, "Email already exists"
        
        # Create new user
        password_hash = self.auth.generate_password_hash(password)
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
        )
        
        saved_user = self.database.save_user(user)
        return True, saved_user, ""
    
    def login_user(
        self,
        username: str,
        password: str,
    ) -> Tuple[bool, Optional[User], str]:
        """
        Login a user.
        Returns: (success, user, error_message)
        """
        user = self.database.get_user_by_username(username)
        if not user:
            return False, None, "Invalid username or password"
        
        if not self.auth.verify_password(user.password_hash or "", password):
            return False, None, "Invalid username or password"
        
        return True, user, ""
    
    def get_current_user(self) -> Optional[User]:
        """Get the current authenticated user."""
        user_id = self.auth.get_current_user_id()
        if not user_id:
            return None
        return self.database.get_user_by_id(user_id)
    
    def create_access_token(self, user_id: int) -> str:
        """Create an access token for a user."""
        return self.auth.create_access_token(user_id)
