"""
Unit tests for AuthService using FakeDatabase and FakeAuth.
Elegant Objects principle: Test with real implementations via ports.
"""
import pytest
from poker_tool.domain.user import User
from poker_tool.ports.database import DatabasePort
from poker_tool.ports.auth import AuthPort
from poker_tool.services.auth_service import AuthService


class FakeDatabase(DatabasePort):
    """Fake implementation of DatabasePort for testing."""
    
    def __init__(self):
        self.users = {}
        self.users_by_username = {}
        self.users_by_email = {}
        self.next_id = 1
    
    def init_app(self, app):
        pass
    
    def create_all(self):
        pass
    
    def drop_all(self):
        pass
    
    # User operations
    def save_user(self, user: User) -> User:
        user_id = self.next_id
        self.next_id += 1
        user = User(
            id=user_id,
            username=user.username,
            email=user.email,
            password_hash=user.password_hash,
        )
        self.users[user_id] = user
        self.users_by_username[user.username] = user
        self.users_by_email[user.email] = user
        return user
    
    def get_user_by_id(self, user_id: int) -> User:
        return self.users.get(user_id)
    
    def get_user_by_username(self, username: str) -> User:
        return self.users_by_username.get(username)
    
    def get_user_by_email(self, email: str) -> User:
        return self.users_by_email.get(email)
    
    def get_all_users(self) -> list:
        return list(self.users.values())
    
    # Range/Scenario operations (not used in these tests)
    def save_range(self, range_obj):
        pass
    def get_range_by_id(self, range_id):
        pass
    def get_all_ranges(self):
        return []
    def get_ranges_by_user(self, user_id):
        return []
    def update_range(self, range_id, data):
        pass
    def delete_range(self, range_id):
        pass
    def save_scenario(self, scenario):
        pass
    def get_scenario_by_id(self, scenario_id):
        pass
    def get_all_scenarios(self):
        return []
    def get_scenarios_by_user(self, user_id):
        return []
    def delete_scenario(self, scenario_id):
        pass


class FakeAuth(AuthPort):
    """Fake implementation of AuthPort for testing."""
    
    def __init__(self):
        self.tokens = {}
        self.current_user_id = None
    
    def init_app(self, app):
        pass
    
    def create_access_token(self, identity: int) -> str:
        token = f"fake_token_{identity}"
        self.tokens[token] = identity
        return token
    
    def get_current_user_id(self) -> int:
        return self.current_user_id
    
    def verify_password(self, password_hash: str, password: str) -> bool:
        # In a real test, you'd compare hashes properly
        # For simplicity, we'll just check if password matches a known value
        return password == "correct_password"
    
    def generate_password_hash(self, password: str) -> str:
        # In a real implementation, this would be a proper hash
        return f"hashed_{password}"


# Fixture for AuthService with FakeDatabase and FakeAuth
@pytest.fixture
def auth_service():
    fake_db = FakeDatabase()
    fake_auth = FakeAuth()
    return AuthService(fake_db, fake_auth)


class TestAuthService:
    """Tests for AuthService using real implementation with FakeDatabase/FakeAuth."""
    
    def test_register_user_success(self, auth_service):
        """Test successful user registration."""
        success, user, error = auth_service.register_user(
            username="testuser",
            email="test@example.com",
            password="password123",
        )
        
        assert success is True
        assert user is not None
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert error == ""
    
    def test_register_user_duplicate_username(self, auth_service):
        """Test registration with duplicate username."""
        # Register first user
        auth_service.register_user(
            username="testuser",
            email="test1@example.com",
            password="password123",
        )
        
        # Try to register with same username
        success, user, error = auth_service.register_user(
            username="testuser",
            email="test2@example.com",
            password="password456",
        )
        
        assert success is False
        assert user is None
        assert error == "Username already exists"
    
    def test_register_user_duplicate_email(self, auth_service):
        """Test registration with duplicate email."""
        # Register first user
        auth_service.register_user(
            username="user1",
            email="test@example.com",
            password="password123",
        )
        
        # Try to register with same email
        success, user, error = auth_service.register_user(
            username="user2",
            email="test@example.com",
            password="password456",
        )
        
        assert success is False
        assert user is None
        assert error == "Email already exists"
    
    def test_login_user_success(self, auth_service):
        """Test successful user login."""
        # Register a user first
        auth_service.register_user(
            username="testuser",
            email="test@example.com",
            password="correct_password",
        )
        
        # Login with correct credentials
        success, user, error = auth_service.login_user(
            username="testuser",
            password="correct_password",
        )
        
        assert success is True
        assert user is not None
        assert user.username == "testuser"
        assert error == ""
    
    def test_login_user_wrong_password(self, auth_service):
        """Test login with wrong password."""
        # Register a user
        auth_service.register_user(
            username="testuser",
            email="test@example.com",
            password="correct_password",
        )
        
        # Login with wrong password
        success, user, error = auth_service.login_user(
            username="testuser",
            password="wrong_password",
        )
        
        assert success is False
        assert user is None
        assert error == "Invalid username or password"
    
    def test_login_user_not_found(self, auth_service):
        """Test login with non-existent user."""
        success, user, error = auth_service.login_user(
            username="nonexistent",
            password="anything",
        )
        
        assert success is False
        assert user is None
        assert error == "Invalid username or password"
    
    def test_create_access_token(self, auth_service):
        """Test creating an access token."""
        token = auth_service.create_access_token(123)
        
        assert isinstance(token, str)
        assert token.startswith("fake_token_")
    
    def test_get_current_user(self, auth_service):
        """Test getting current user (when not authenticated)."""
        user = auth_service.get_current_user()
        assert user is None
