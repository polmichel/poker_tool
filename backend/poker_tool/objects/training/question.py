"""
Immutable training question value object (Elegant Objects).
"""
from typing import Dict


class TrainingQuestion:
    """Immutable training question value object."""

    def __init__(self, hand: str, question: str, correct_answer: str):
        self._hand = hand
        self._question = question
        self._correct_answer = correct_answer

    @property
    def hand(self) -> str:
        """Hand string."""
        return self._hand

    @property
    def question(self) -> str:
        """Question text."""
        return self._question

    @property
    def correct_answer(self) -> str:
        """Correct answer."""
        return self._correct_answer

    def is_correct(self, answer: str) -> bool:
        """Check if answer is correct."""
        return answer.lower() == self._correct_answer.lower()

    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            "hand": self._hand,
            "question": self._question,
            "correct_answer": self._correct_answer,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'TrainingQuestion':
        """Create from dictionary."""
        return cls(
            hand=data["hand"],
            question=data["question"],
            correct_answer=data["correct_answer"],
        )

    def __eq__(self, other: object) -> bool:
        """Equality comparison."""
        if not isinstance(other, TrainingQuestion):
            return False
        return (
            self._hand == other._hand and
            self._question == other._question and
            self._correct_answer == other._correct_answer
        )

    def __hash__(self) -> int:
        """Hash for use in sets/dicts."""
        return hash((self._hand, self._question, self._correct_answer))
