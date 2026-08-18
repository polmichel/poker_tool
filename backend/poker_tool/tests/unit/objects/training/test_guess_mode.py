"""
Unit tests for the "Deviner une range" (guess) training mode.

The guess mode displays a range's 169-cell grid (without its name) and asks the
user to identify which range of the library it matches, as a multiple-choice
question on range names.
"""
import json
import unittest
from unittest.mock import patch

from poker_tool.objects.action import Action, ActionType
from poker_tool.objects.position import Position
from poker_tool.objects.range import Range
from poker_tool.objects.range_type import RangeType
from poker_tool.objects.training.session import TrainingSession
from poker_tool.objects.user import User


def _make_range(name: str, hands: dict[str, ActionType], range_id: int) -> Range:
    return Range(
        name=name,
        range_type=RangeType.PREFLOP,
        position=Position.BTN,
        hands={h: Action(a) for h, a in hands.items()},
        range_id=range_id,
    )


class TestGuessMode(unittest.TestCase):
    """Tests for the "Deviner une range" (guess) training mode."""

    def setUp(self):
        self.user = User("testuser", "test@example.com", user_id=1)
        self.target = _make_range(
            "UTG Open",
            {"AA": ActionType.RAISE, "KK": ActionType.OPEN, "AKs": ActionType.OPEN},
            range_id=1,
        )
        self.other_a = _make_range(
            "BTN Steal",
            {"72o": ActionType.OPEN, "T9s": ActionType.CALL},
            range_id=2,
        )
        self.other_b = _make_range(
            "SB Push",
            {"A5s": ActionType.ALL_IN, "22": ActionType.ALL_IN},
            range_id=3,
        )
        self.library = [self.target, self.other_a, self.other_b]

    @patch('poker_tool.objects.training.session.random.shuffle')
    @patch('poker_tool.objects.training.session.random.sample')
    def test_guess_generates_qcm_questions_from_library(self, mock_sample, mock_shuffle):
        """Each guess question carries a grid, options, and the target name."""
        # random.sample picks the target ranges (one per question).
        mock_sample.return_value = [self.target]
        # Keep the option order deterministic so the correct name lands first.
        mock_shuffle.return_value = None

        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=1,
            session_id=1,
            library_ranges=self.library,
        )

        self.assertEqual(len(session._questions), 1)
        question = session.current_question
        self.assertEqual(question.type, "guess")
        self.assertEqual(question.correct_answer, "UTG Open")
        # The grid is a JSON object covering the 169 cells.
        grid = json.loads(question.grid)
        self.assertEqual(len(grid), 169)
        self.assertEqual(grid["AA"], "raise")
        self.assertEqual(grid["KK"], "open")
        self.assertEqual(grid["72o"], "fold")
        # Options are range names and include the correct one.
        self.assertIn("UTG Open", question.options)

    @patch('poker_tool.objects.training.session.random.shuffle')
    @patch('poker_tool.objects.training.session.random.sample')
    def test_guess_question_count_capped_by_library_size(self, mock_sample, mock_shuffle):
        """Cannot generate more questions than distinct ranges available."""
        mock_sample.return_value = self.library  # 3 distinct targets
        mock_shuffle.return_value = None

        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=10,
            session_id=1,
            library_ranges=self.library,
        )
        self.assertEqual(len(session._questions), 3)

    @patch('poker_tool.objects.training.session.random.shuffle')
    @patch('poker_tool.objects.training.session.random.sample')
    def test_guess_answer_correct_increments_score(self, mock_sample, mock_shuffle):
        """Answering the correct range name scores a point."""
        mock_sample.return_value = [self.target]
        mock_shuffle.return_value = None

        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=1,
            session_id=1,
            library_ranges=self.library,
        )

        answered = session.answer("UTG Open")
        self.assertEqual(answered.correct_answers, 1)
        self.assertTrue(answered.is_complete)
        self.assertEqual(answered.score, 100.0)

    @patch('poker_tool.objects.training.session.random.shuffle')
    @patch('poker_tool.objects.training.session.random.sample')
    def test_guess_answer_wrong_does_not_score(self, mock_sample, mock_shuffle):
        """A wrong range name scores zero."""
        mock_sample.return_value = [self.target]
        mock_shuffle.return_value = None

        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=1,
            session_id=1,
            library_ranges=self.library,
        )

        answered = session.answer("BTN Steal")
        self.assertEqual(answered.correct_answers, 0)
        self.assertTrue(answered.is_complete)
        self.assertEqual(answered.score, 0.0)

    @patch('poker_tool.objects.training.session.random.shuffle')
    @patch('poker_tool.objects.training.session.random.sample')
    def test_guess_answer_is_case_insensitive(self, mock_sample, mock_shuffle):
        mock_sample.return_value = [self.target]
        mock_shuffle.return_value = None

        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=1,
            session_id=1,
            library_ranges=self.library,
        )
        answered = session.answer("utg open")
        self.assertEqual(answered.correct_answers, 1)

    @patch('poker_tool.objects.training.session.random.shuffle')
    @patch('poker_tool.objects.training.session.random.sample')
    def test_guess_answer_does_not_mutate_original(self, mock_sample, mock_shuffle):
        """Answering must not mutate the original session (immutability)."""
        mock_sample.return_value = [self.target]
        mock_shuffle.return_value = None

        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=1,
            session_id=1,
            library_ranges=self.library,
        )
        original_index = session.current_index
        original_correct = session.correct_answers
        original_questions = list(session._questions)

        session.answer("UTG Open")

        self.assertEqual(session.current_index, original_index)
        self.assertEqual(session.correct_answers, original_correct)
        self.assertEqual(session._questions, original_questions)

    def test_guess_falls_back_to_session_range_without_library(self):
        """Without a library, the session range is the only candidate."""
        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=1,
            session_id=1,
        )
        self.assertEqual(len(session._questions), 1)
        question = session.current_question
        self.assertEqual(question.correct_answer, "UTG Open")
        self.assertEqual(len(question.options), 1)

    def test_guess_no_candidates_generates_no_questions(self):
        """A rangeless session and empty library produce no questions."""
        empty_range = _make_range("Empty", {}, range_id=1)
        session = TrainingSession(
            user=self.user,
            range_obj=empty_range,
            mode="guess",
            total_questions=5,
            session_id=1,
            library_ranges=[],
        )
        self.assertEqual(len(session._questions), 0)

    @patch('poker_tool.objects.training.session.random.shuffle')
    @patch('poker_tool.objects.training.session.random.sample')
    def test_guess_question_serializes_options_and_grid(self, mock_sample, mock_shuffle):
        """to_dict round-trips the options and grid fields."""
        mock_sample.return_value = [self.target]
        mock_shuffle.return_value = None

        session = TrainingSession(
            user=self.user,
            range_obj=self.target,
            mode="guess",
            total_questions=1,
            session_id=1,
            library_ranges=self.library,
        )
        data = session.current_question.to_dict()
        self.assertEqual(data["type"], "guess")
        self.assertIn("options", data)
        self.assertIn("grid", data)
        self.assertIn("UTG Open", data["options"])

        from poker_tool.objects.training.question import TrainingQuestion
        restored = TrainingQuestion.from_dict(data)
        self.assertEqual(restored.correct_answer, "UTG Open")
        self.assertEqual(restored.options, data["options"])
        self.assertEqual(restored.grid, data["grid"])


if __name__ == '__main__':
    unittest.main()
