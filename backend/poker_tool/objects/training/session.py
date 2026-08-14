"""
Immutable training session entity (Elegant Objects).
"""
import random
from datetime import UTC, datetime

from ..range import Range
from ..user import User
from .question import TrainingQuestion

# Sentinel for "no override" in _clone (distinct from None which is a valid value).
_UNSET = object()


class TrainingSession:
    """Training session entity."""

    def __init__(
        self,
        user: User,
        range_obj: Range,
        mode: str = "fill",
        total_questions: int = 10,
        session_id: int | None = None,
    ):
        self._user = user
        self._range = range_obj
        self._mode = mode
        self._total_questions = total_questions
        self._id = session_id
        self._questions: list[TrainingQuestion] = []
        self._current_index = 0
        self._correct_answers = 0
        self._start_time = datetime.now(UTC)
        self._ended_at: datetime | None = None

        # Generate questions
        self._generate_questions()

    @property
    def id(self) -> int | None:
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
    def current_question(self) -> TrainingQuestion | None:
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
        end = self._ended_at or datetime.now(UTC)
        return int((end - self._start_time).total_seconds())

    @property
    def is_complete(self) -> bool:
        """Is session complete."""
        return self._current_index >= len(self._questions) or \
               self._current_index >= self._total_questions

    def _clone(self, questions=None, current_index=None,
              correct_answers=None, ended_at=_UNSET) -> 'TrainingSession':
        """Return a copy of this session with overridden fields (immutable).

        ``_questions`` is copied by value (a new list) so the original and the
        clone never share mutable state.
        """
        new_session = TrainingSession.__new__(TrainingSession)
        new_session._user = self._user
        new_session._range = self._range
        new_session._mode = self._mode
        new_session._total_questions = self._total_questions
        new_session._id = self._id
        new_session._questions = list(questions) if questions is not None else list(self._questions)
        new_session._current_index = self._current_index if current_index is None else current_index
        new_session._correct_answers = self._correct_answers if correct_answers is None else correct_answers
        new_session._start_time = self._start_time
        new_session._ended_at = self._ended_at if ended_at is _UNSET else ended_at
        return new_session

    def answer(self, answer: str) -> 'TrainingSession':
        """Submit an answer and move to next question (immutable)."""
        if self.is_complete:
            return self

        current = self.current_question
        if current and answer.lower() == current.correct_answer.lower():
            new_correct = self._correct_answers + 1
        else:
            new_correct = self._correct_answers

        new_index = self._current_index + 1
        ended_at = datetime.now(UTC) if (
            new_index >= len(self._questions) or new_index >= self._total_questions
        ) else None
        return self._clone(
            current_index=new_index,
            correct_answers=new_correct,
            ended_at=ended_at,
        )

    def end(self) -> 'TrainingSession':
        """End the session (immutable)."""
        return self._clone(ended_at=datetime.now(UTC))

    def to_dict(self) -> dict:
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
    def from_dict(cls, data: dict, user: User, range_obj: Range) -> 'TrainingSession':
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
        from ..hand import generate_all_hands

        range_hands = self._range.hands
        all_hands = generate_all_hands()
        range_hand_strings = list(range_hands.keys())

        if self._mode == "fill":
            # Mode "Remplir une range" : l'utilisateur doit remplir une grille vide
            # On sélectionne des mains aléatoires et on demande leur action
            if len(range_hand_strings) == 0:
                # No hands in range, cannot generate questions
                return

            selected_hands = random.sample(range_hand_strings, min(self._total_questions, len(range_hand_strings)))
            for hand_str in selected_hands:
                action = range_hands.get(hand_str)
                correct_answer = str(action) if action else "fold"
                self._questions.append(
                    TrainingQuestion(
                        hand=hand_str,
                        question=f"Quelle action pour {hand_str} ?",
                        correct_answer=correct_answer,
                        q_type=self._mode,
                    )
                )

        elif self._mode == "guess":
            # Mode "Deviner une range" : l'utilisateur doit deviner si une main fait partie de la range
            # On mélange des mains dans la range et des mains hors de la range
            non_range_hands = [str(h) for h in all_hands if str(h) not in range_hand_strings]

            # Si il n'y a pas de mains hors de la range, on prend toutes les questions dans la range
            if len(non_range_hands) == 0:
                # Toutes les mains sont dans la range, on prend uniquement des mains de la range
                selected_hands = random.sample(range_hand_strings, min(self._total_questions, len(range_hand_strings)))
            else:
                half = self._total_questions // 2
                selected_in_range = random.sample(range_hand_strings, min(half, len(range_hand_strings)))
                selected_out_range = random.sample(non_range_hands, min(half, len(non_range_hands)))
                selected_hands = selected_in_range + selected_out_range

            for hand_str in selected_hands:
                is_in_range = hand_str in range_hands
                self._questions.append(
                    TrainingQuestion(
                        hand=hand_str,
                        question=f"Est-ce que {hand_str} fait partie de cette range ?",
                        correct_answer=str(is_in_range).lower(),
                        q_type=self._mode,
                    )
                )

        elif self._mode == "complete":
            # Mode "Compléter une range" : l'utilisateur doit compléter une range partiellement remplie
            # On sélectionne des mains de la range et on en cache certaines
            if len(range_hand_strings) == 0:
                return

            selected_hands = random.sample(range_hand_strings, min(self._total_questions, len(range_hand_strings)))
            for hand_str in selected_hands:
                action = range_hands.get(hand_str)
                self._questions.append(
                    TrainingQuestion(
                        hand=hand_str,
                        question=f"Quelle est l'action pour {hand_str} dans cette range ?",
                        correct_answer=str(action) if action else "fold",
                        q_type=self._mode,
                    )
                )
