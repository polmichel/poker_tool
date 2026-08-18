"""
Immutable training session entity (Elegant Objects).
"""
import json
import random
from datetime import UTC, datetime

from ..range import Range
from ..user import User
from .question import TrainingQuestion

# Sentinel for "no override" in _clone (distinct from None which is a valid value).
_UNSET = object()

# Maximum number of range names offered as choices in the "Deviner une range"
# mode (the correct one plus a few distractors).
_GUESS_OPTIONS_COUNT = 4


class TrainingSession:
    """Training session entity."""

    def __init__(
        self,
        user: User,
        range_obj: Range,
        mode: str = "fill",
        total_questions: int = 10,
        session_id: int | None = None,
        library_ranges: list[Range] | None = None,
    ):
        self._user = user
        self._range = range_obj
        self._mode = mode
        self._total_questions = total_questions
        self._id = session_id
        self._library_ranges = list(library_ranges) if library_ranges else []
        self._questions: list[TrainingQuestion] = []
        self._current_index = 0
        self._correct_answers = 0
        self._start_time = datetime.now(UTC).replace(tzinfo=None)
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
        """Current score (percentage).

        For ``grid_paint`` sessions the score is the share of the 169 cells
        that match the reference range. Other modes count one point per
        correctly answered question.
        """
        if self.is_grid_mode:
            return round((self._correct_answers / 169) * 100, 2)
        if self._current_index == 0:
            return 0.0
        return (self._correct_answers / self._current_index) * 100

    @property
    def is_grid_mode(self) -> bool:
        """Whether this session is a grid-painting exercise (single grid)."""
        return bool(self._questions) and self._questions[0].type == "grid_paint"

    @property
    def time_spent(self) -> int:
        """Time spent in seconds."""
        end = self._ended_at or datetime.now(UTC).replace(tzinfo=None)
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
        new_session._library_ranges = list(self._library_ranges)
        new_session._questions = list(questions) if questions is not None else list(self._questions)
        new_session._current_index = self._current_index if current_index is None else current_index
        new_session._correct_answers = self._correct_answers if correct_answers is None else correct_answers
        new_session._start_time = self._start_time
        new_session._ended_at = self._ended_at if ended_at is _UNSET else ended_at
        return new_session

    def answer(self, answer: str) -> 'TrainingSession':
        """Submit an answer and move to next question (immutable).

        For ``grid_paint`` questions the answer is a JSON object mapping each
        hand string to an action (the painted grid). The grid is scored cell by
        cell against the reference range: the number of matching cells becomes
        the session's ``correct_answers`` and the session completes in a single
        step (one grid exercise per session).
        """
        if self.is_complete:
            return self

        current = self.current_question
        if current and current.type == "grid_paint":
            new_correct = self._score_grid(answer)
        elif current and answer.lower() == current.correct_answer.lower():
            new_correct = self._correct_answers + 1
        else:
            new_correct = self._correct_answers

        new_index = self._current_index + 1
        ended_at = datetime.now(UTC).replace(tzinfo=None) if (
            new_index >= len(self._questions) or new_index >= self._total_questions
        ) else None
        return self._clone(
            current_index=new_index,
            correct_answers=new_correct,
            ended_at=ended_at,
        )

    def _grid_reference(self, range_obj: Range | None = None) -> dict:
        """Return the given range (default: the session range) as a 169-cell
        ``{hand: action}`` map.

        Matches the 13x13 grid layout (suited above the diagonal, offsuit
        below, pairs on it). Hands absent from the range map to ``fold``.
        """
        from ..hand import RANKS

        reference_range = range_obj if range_obj is not None else self._range
        reference: dict[str, str] = {}
        for i, rank1 in enumerate(RANKS):
            for j, rank2 in enumerate(RANKS):
                if i < j:
                    hand_str = f"{rank1}{rank2}s"
                elif i > j:
                    hand_str = f"{rank2}{rank1}o"
                else:
                    hand_str = f"{rank1}{rank2}"
                action = reference_range.hands.get(hand_str)
                reference[hand_str] = str(action) if action else "fold"
        return reference
    def _score_grid(self, answer: str) -> int:
        """Count how many of the 169 grid cells match the reference range.

        ``answer`` is a JSON object ``{hand: action}`` covering the 13x13 grid
        (suited cells above the diagonal, offsuit below, pairs on it). Missing or
        unpainted cells count as ``fold``. Comparison is case-insensitive.
        """
        from ..hand import RANKS

        reference = self._range.hands
        try:
            painted = json.loads(answer) if answer else {}
        except (TypeError, ValueError):
            painted = {}

        def expected_action(hand_str: str) -> str:
            action = reference.get(hand_str)
            return str(action) if action else "fold"

        def painted_action(hand_str: str) -> str:
            action = painted.get(hand_str) or painted.get(hand_str.upper())
            return str(action) if action else "fold"

        correct = 0
        for i, rank1 in enumerate(RANKS):
            for j, rank2 in enumerate(RANKS):
                if i < j:
                    hand_str = f"{rank1}{rank2}s"
                elif i > j:
                    hand_str = f"{rank2}{rank1}o"
                else:
                    hand_str = f"{rank1}{rank2}"
                if expected_action(hand_str).lower() == painted_action(hand_str).lower():
                    correct += 1
        return correct

    def end(self) -> 'TrainingSession':
        """End the session (immutable)."""
        return self._clone(ended_at=datetime.now(UTC).replace(tzinfo=None))

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
        if self._mode == "fill":
            self._generate_fill_questions()
        elif self._mode == "guess":
            self._generate_guess_questions()
        elif self._mode == "complete":
            self._generate_complete_questions()

    def _generate_fill_questions(self) -> None:
        """Mode "Remplir une range" : l'utilisateur peint une grille vide puis
        valide. La range de référence entière (169 cellules) est la
        réponse attendue ; l'évaluation se fait case par case.
        """
        range_hand_strings = list(self._range.hands.keys())
        if len(range_hand_strings) == 0:
            # No hands in range, cannot generate questions
            return

        reference = self._grid_reference()
        self._questions.append(
            TrainingQuestion(
                hand="grid",
                question="Remplissez la range en coloriant la grille, puis validez.",
                correct_answer=json.dumps(reference),
                q_type="grid_paint",
            )
        )

    def _generate_guess_questions(self) -> None:
        """Mode "Deviner une range" : une grille (une range de la bibliothèque,
        sans son nom) est affichée et l'utilisateur doit deviner à quelle range
        de la bibliothèque elle correspond.

        Chaque question tire une range cible parmi les ranges disponibles
        (la bibliothèque passée à la session, sinon la range de la session),
        sérialise sa grille 169 cellules, et propose en QCM le nom de la range
        cible mélangé avec des noms d'autres ranges (distracteurs). La réponse
        attendue est le nom de la range cible.
        """
        # Build the candidate pool: prefer the library ranges (with at least one
        # hand so the grid is meaningful), fall back to the session range.
        candidates = [r for r in self._library_ranges if r.hands]
        if not candidates and self._range.hands:
            candidates = [self._range]
        if not candidates:
            return

        # Distinct range names available for the QCM options.
        names = [r.name for r in candidates]

        question_count = min(self._total_questions, len(candidates))
        targets = random.sample(candidates, question_count)

        for target in targets:
            grid_json = json.dumps(self._grid_reference(target))
            options = self._guess_options(target.name, names)
            self._questions.append(
                TrainingQuestion(
                    hand="grid",
                    question="À quelle range de la bibliothèque correspond cette grille ?",
                    correct_answer=target.name,
                    q_type=self._mode,
                    options=options,
                    grid=grid_json,
                )
            )

    def _guess_options(self, correct_name: str, all_names: list[str]) -> list[str]:
        """Build the shuffled QCM options: the correct name plus a few
        distractors drawn from the other range names.
        """
        distractors = [n for n in all_names if n != correct_name]
        random.shuffle(distractors)
        picked = distractors[: max(0, _GUESS_OPTIONS_COUNT - 1)]
        options = [*picked, correct_name]
        random.shuffle(options)
        return options

    def _generate_complete_questions(self) -> None:
        """Mode "Compléter une range" : l'utilisateur doit compléter une range
        partiellement remplie. On sélectionne des mains de la range et on
        demande l'action attendue.
        """

        range_hands = self._range.hands
        range_hand_strings = list(range_hands.keys())
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
