"""
Database Port Interface (Elegant Objects principles).
This is an abstraction layer for database operations.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from ..domain.range import Range
from ..domain.user import User
from ..domain.scenario import Scenario


class DatabasePort(ABC):
    """Abstract interface for database operations."""
    
    @abstractmethod
    def init_app(self, app: Any) -> None:
        """Initialize the database with the Flask app."""
        pass
    
    @abstractmethod
    def create_all(self) -> None:
        """Create all database tables."""
        pass
    
    @abstractmethod
    def drop_all(self) -> None:
        """Drop all database tables."""
        pass
    
    # User operations
    @abstractmethod
    def save_user(self, user: User) -> User:
        """Save a user to the database."""
        pass
    
    @abstractmethod
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        pass
    
    @abstractmethod
    def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username."""
        pass
    
    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        pass
    
    @abstractmethod
    def get_all_users(self) -> List[User]:
        """Get all users."""
        pass
    
    # Range operations
    @abstractmethod
    def save_range(self, range_obj: Range) -> Range:
        """Save a range to the database."""
        pass
    
    @abstractmethod
    def get_range_by_id(self, range_id: int) -> Optional[Range]:
        """Get a range by ID."""
        pass
    
    @abstractmethod
    def get_all_ranges(self) -> List[Range]:
        """Get all ranges."""
        pass
    
    @abstractmethod
    def get_ranges_by_user(self, user_id: int) -> List[Range]:
        """Get all ranges for a specific user."""
        pass
    
    @abstractmethod
    def update_range(self, range_id: int, data: Dict) -> Optional[Range]:
        """Update a range."""
        pass
    
    @abstractmethod
    def delete_range(self, range_id: int) -> bool:
        """Delete a range."""
        pass
    
    # Scenario operations
    @abstractmethod
    def save_scenario(self, scenario: Scenario) -> Scenario:
        """Save a scenario to the database."""
        pass
    
    @abstractmethod
    def get_scenario_by_id(self, scenario_id: int) -> Optional[Scenario]:
        """Get a scenario by ID."""
        pass
    
    @abstractmethod
    def get_all_scenarios(self) -> List[Scenario]:
        """Get all scenarios."""
        pass
    
    @abstractmethod
    def get_scenarios_by_user(self, user_id: int) -> List[Scenario]:
        """Get all scenarios for a specific user."""
        pass
    
    @abstractmethod
    def delete_scenario(self, scenario_id: int) -> bool:
        """Delete a scenario."""
        pass
