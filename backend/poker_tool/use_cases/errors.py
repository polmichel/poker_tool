"""
Centralized exceptions for Poker Tool use cases (Elegant Objects).

All domain-level exceptions are defined here to avoid duplication and
ensure consistency across the codebase. This follows the principle of
having a single source of truth for error types.
"""


class DomainError(Exception):
    """Base class for all domain-level errors."""

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.__class__.__doc__ or "Domain error"
        super().__init__(self.message)


# ============================================================================
# Not Found Errors
# ============================================================================


class NotFoundError(DomainError):
    """Base class for entity not found errors."""

    def __init__(self, entity_type: str, entity_id: int | str | None = None) -> None:
        self.entity_type = entity_type
        self.entity_id = entity_id
        message = f"{entity_type} not found"
        if entity_id is not None:
            message += f": {entity_id}"
        super().__init__(message)


class RangeNotFound(NotFoundError):
    """Raised when a range does not exist."""

    def __init__(self, range_id: int | None = None) -> None:
        super().__init__("Range", range_id)


class UserNotFound(NotFoundError):
    """Raised when a user does not exist."""

    def __init__(self, user_id: int | None = None) -> None:
        super().__init__("User", user_id)


class SessionNotFound(NotFoundError):
    """Raised when a training session does not exist."""

    def __init__(self, session_id: int | None = None) -> None:
        super().__init__("Training session", session_id)


# ============================================================================
# Authentication Errors
# ============================================================================


class AuthenticationError(DomainError):
    """Base class for authentication-related errors."""


class InvalidCredentials(AuthenticationError):
    """Raised when the username is unknown or the password is wrong."""

    def __init__(self, message: str = "Invalid credentials") -> None:
        super().__init__(message)


class UserAlreadyExists(AuthenticationError):
    """Raised when the username or email is already taken."""

    def __init__(self, message: str = "User already exists") -> None:
        super().__init__(message)


class UserRequired(DomainError):
    """Raised when a user is required but none can be resolved."""

    def __init__(self, message: str = "User required") -> None:
        super().__init__(message)


# ============================================================================
# Range Errors
# ============================================================================


class RangeError(DomainError):
    """Base class for range-related errors."""


class RangeHasNoHands(RangeError):
    """Raised when a range has no hands to train on."""

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or "Range has no hands")
