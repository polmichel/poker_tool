"""Shared exceptions for the training use cases.

Keeping training-related errors in one place avoids the duplicate
``SessionNotFound`` definitions that previously lived in both
``answer_question`` and ``end_training_session``.
"""


class SessionNotFound(Exception):
    """Raised when a training session does not exist."""
