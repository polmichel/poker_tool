"""Shared exceptions for the training use cases.

This module re-exports training-related exceptions from the centralized
errors module to maintain backward compatibility.
"""

from .errors import SessionNotFound

__all__ = ["SessionNotFound"]
