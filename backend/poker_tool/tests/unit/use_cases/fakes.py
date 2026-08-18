"""
In-memory fakes for the ports (Elegant Objects testing philosophy).

These are NOT mocks — they are real, minimal implementations of the ports
that store data in memory. They let use cases be tested with real behavior
and zero coupling to SQLAlchemy/Flask.
"""

from typing import ClassVar

from poker_tool.interfaces.equity_calculator import EquityCalculator
from poker_tool.interfaces.hand_evaluator import HandEvaluator
from poker_tool.interfaces.ranges import Ranges
from poker_tool.interfaces.training_sessions import TrainingSessions
from poker_tool.interfaces.users import Users
from poker_tool.objects.equity import EquityByHand, EquityResult
from poker_tool.objects.range import Range
from poker_tool.objects.training.session import TrainingSession
from poker_tool.objects.user import User


class FakeUsers(Users):
    """In-memory Users implementation."""

    def __init__(self) -> None:
        self._users: dict[int, User] = {}
        self._next_id = 1

    def add(self, user: User) -> User:
        uid = user.id if user.id else self._next_id
        if not user.id:
            self._next_id += 1
        stored = User(
            username=user.username,
            email=user.email,
            password_hash=user.password_hash,
            user_id=uid,
        )
        self._users[uid] = stored
        return stored

    def user_by_id(self, user_id: int) -> User | None:
        return self._users.get(user_id)

    def user_by_username(self, username: str) -> User | None:
        return next((u for u in self._users.values() if u.username == username), None)

    def user_by_email(self, email: str) -> User | None:
        return next((u for u in self._users.values() if u.email == email), None)

    def all(self) -> list[User]:
        return list(self._users.values())


class FakeRanges(Ranges):
    """In-memory Ranges implementation."""

    def __init__(self) -> None:
        self._ranges: dict[int, Range] = {}
        self._next_id = 1

    def add(self, range_obj: Range) -> Range:
        rid = range_obj.id if range_obj.id else self._next_id
        if not range_obj.id:
            self._next_id += 1
        stored = Range.from_dict({**range_obj.to_dict(), "id": rid})
        self._ranges[rid] = stored
        return stored

    def range_by_id(self, range_id: int) -> Range | None:
        return self._ranges.get(range_id)

    def all(self) -> list[Range]:
        return list(self._ranges.values())

    def remove(self, range_obj: Range) -> None:
        if range_obj.id and range_obj.id in self._ranges:
            del self._ranges[range_obj.id]

    def ranges_by_user(self, user_id: int) -> list[Range]:
        return [r for r in self._ranges.values() if r.user_id == user_id]


class FakeSessions(TrainingSessions):
    """In-memory TrainingSessions implementation."""

    def __init__(self) -> None:
        self._sessions: dict[int, TrainingSession] = {}
        self._next_id = 1

    def add(self, session: TrainingSession) -> TrainingSession:
        sid = session.id if session.id else self._next_id
        if not session.id:
            self._next_id += 1
        # Reconstruct with an id (immutable pattern)
        stored = TrainingSession(
            user=session.user,
            range_obj=session.range,
            mode=session.mode,
            total_questions=session.total_questions,
            session_id=sid,
        )
        stored._questions = session._questions
        stored._current_index = session._current_index
        stored._correct_answers = session._correct_answers
        stored._start_time = session._start_time
        stored._ended_at = session._ended_at
        self._sessions[sid] = stored
        return stored

    def session_by_id(self, session_id: int) -> TrainingSession | None:
        return self._sessions.get(session_id)

    def all(self) -> list[TrainingSession]:
        return list(self._sessions.values())

    def sessions_by_user(self, user_id: int) -> list[TrainingSession]:
        return [s for s in self._sessions.values() if s.user.id == user_id]


class FakeAuth:
    """In-memory Auth implementation (only what use cases need)."""

    def __init__(self) -> None:
        self._current: User | None = None

    def set_current_user(self, user: User | None) -> None:
        self._current = user

    def current_user(self) -> User | None:
        return self._current

    def create_user(self, username: str, email: str, password: str) -> User:
        return User(username=username, email=email, password_hash=f"hashed_{password}")

    def check_password(self, password: str, password_hash: str) -> bool:
        return password_hash == f"hashed_{password}"

    def generate_token(self, user: User) -> str:
        return f"token_for_{user.id}"


class FakeEquityCalculator(EquityCalculator):
    """Deterministic in-memory EquityCalculator for testing the web layer.

    Returns a fixed equity result without touching the exact table or the
    Monte-Carlo engine, so controller/Flask tests stay fast and decoupled from
    the equity strategy.
    """

    def __init__(self, result: EquityResult | None = None) -> None:
        self._result = result or EquityResult(
            hero="AKs",
            win=50.0,
            tie=0.0,
            lose=50.0,
            iterations=1,
            by_hand=[EquityByHand(hand="QQ", win=50.0, tie=0.0, lose=50.0, combos=6)],
        )

    def compute(self, hero: str, range_hands: list[str]) -> EquityResult:
        return self._result


class FakeHandEvaluator(HandEvaluator):
    """Deterministic in-memory HandEvaluator for testing the equity use case.

    Ranks hands by the first hole card's rank index (A=0 ... 2=12) so the
    simulation produces reproducible, easy-to-assert win/tie/lose values
    without depending on a real evaluator implementation.
    """

    _RANKS: ClassVar[list[str]] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']

    def evaluate(self, hole_cards: list[str], board: list[str]) -> int:
        # Lower is better; use the best (lowest) rank index of the two hole cards.
        ranks = [self._RANKS.index(c[0].upper()) for c in hole_cards]
        return min(ranks)
