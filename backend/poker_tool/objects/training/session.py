"""
Immutable training session entity (Elegant Objects).
"""
from datetime import datetime
from typing import Optional, List, Dict
from ..user import User
from ..range import Range
from .question import TrainingQuestion
import random


class TrainingSession:
    """Training session entity."""

    def __init__(
        self,
        user: User,
        range_obj: Range,
        mode: str = "fill",
        total_questions: int = 10,
        session_id: Optional[int] = None,
    ):
        self._user = user
        self._range = range_obj
        self._mode = mode
        self._total_questions = total_questions
        self._id = session_id
        self._questions: List[TrainingQuestion] = []
        self._current_index = 0
        self._correct_answers = 0
        self._start_time = datetime.utcnow()
        self._ended_at: Optional[datetime] = None

        # Generate questions
        self._generate_questions()

    @property
    def id(self) -> Optional[int]:
        """Session ID."""
        return self._id

    @property
    def user(self) -> User:
        """User."""
        return self._user

    @property
    def range(self) -> Range:
        """Range."""
        return self._range

    @property
    def mode(self) -> str:
        """Mode."""
        return self._mode

    @property
    def total_questions(self) -> int:
        """Total questions."""
        return self._total_questions

    @property
    def current_question(self) -> Optional[TrainingQuestion]:
        """Current question."""
        if self._current_index < len(self._questions):
            return self._questions[self._current_index]
        return None

    @property
    def current_index(self) -> int:
        """Current question index."""
        return self._current_index

    @property
    def correct_answers(self) -> int:
        """Number of correct answers."""
        return self._correct_answers

    @property
    def score(self) -> float:
        """Current score (percentage)."""
        if self._current_index == 0:
            return 0.0
        return (self._correct_answers / self._current_index) * 100

    @property
    def time_spent(self) -> int:
        """Time spent in seconds."""
        end = self._ended_at or datetime.utcnow()
        return int((end - self._start_time).total_seconds())

    @property
    def is_complete(self) -> bool:
        """Is session complete."""
        return self._current_index >= len(self._questions) or \
               self._current_index >= self._total_questions

    def answer(self, answer: str) -> 'TrainingSession':
        """Submit an answer and move to next question (immutable)."""
        if self.is_complete:
            return self

        current = self.current_question
        if current and answer.lower() == current.correct_answer.lower():
            new_correct = self._correct_answers + 1
        else:
            new_correct = self._correct_answers

        new_session = TrainingSession(
            user=self._user,
            range_obj=self._range,
            mode=self._mode,
            total_questions=self._total_questions,
            session_id=self._id,
        )
        new_session._questions = self._questions
        new_session._current_index = self._current_index + 1
        new_session._correct_answers = new_correct
        new_session._start_time = self._start_time

        if new_session.is_complete:
            new_session._ended_at = datetime.utcnow()

        return new_session

    def end(self) -> 'TrainingSession':
        """End the session (immutable)."""
        new_session = TrainingSession(
            user=self._user,
            range_obj=self._range,
            mode=self._mode,
            total_questions=self._total_questions,
            session_id=self._id,
        )
        new_session._questions = self._questions
        new_session._current_index = self._current_index
        new_session._correct_answers = self._correct_answers
        new_session._start_time = self._start_time
        new_session._ended_at = datetime.utcnow()
        return new_session

    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            "id": self._id,
            "user_id": self._user.id,
            "range_id": self._range.id,
            "mode": self._mode,
            "total_questions": self._total_questions,
            "current_question_index": self._current_index,
            "correct_answers": self._correct_answers,
            "score": round(self.score, 2),
            "time_spent": self.time_spent,
            "is_complete": self.is_complete,
            "start_time": self._start_time.isoformat(),
            "ended_at": self._ended_at.isoformat() if self._ended_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict, user: User, range_obj: Range) -> 'TrainingSession':
        """Create from dictionary."""
        session = cls(
            user=user,
            range_obj=range_obj,
            mode=data.get("mode", "fill"),
            total_questions=data.get("total_questions", 10),
            session_id=data.get("id"),
        )
        session._current_index = data.get("current_question_index", 0)
        session._correct_answers = data.get("correct_answers", 0)
        session._start_time = datetime.fromisoformat(data.get("start_time"))
        if data.get("ended_at"):
            session._ended_at = datetime.fromisoformat(data.get("ended_at"))
        return session

    def _generate_questions(self) -> None:
        """Generate questions for this session."""
        from ..hand import RANKS, generate_all_hands

        if self._mode == "fill":
            # Generate questions based on range
            range_hands = self._range.hands
            all_hands = generate_all_hands()

            # Get hands from range
            range_hand_strings = list(range_hands.keys())

            if len(range_hand_strings) >= self._total_questions:
                selected_hands = random.sample(range_hand_strings, self._total_questions)
            else:
                # Mix with random hands
                remaining = self._total_questions - len(range_hand_strings)
                other_hands = [h.to_string for h in all_hands if h.to_string not in range_hand_strings]
                extra = random.sample(other_hands, min(remaining, len(other_hands)))
                selected_hands = range_hand_strings + extra

            for hand_str in selected_hands:
                action = range_hands.get(hand_str)
                correct_answer = str(action) if action else "fold"
                self._questions.append(
                    TrainingQuestion(
                        hand=hand_str,
                        question=f"Quelle action pour {hand_str} ?",
                        correct_answer=correct_answer,
                    )
                )
