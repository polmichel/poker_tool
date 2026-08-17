"""
Unit tests for TrainingSession entity.
"""
import unittest
from datetime import datetime
from unittest.mock import patch

from poker_tool.objects.action import Action, ActionType
from poker_tool.objects.position import Position
from poker_tool.objects.range import Range
from poker_tool.objects.range_type import RangeType
from poker_tool.objects.training.session import TrainingSession
from poker_tool.objects.user import User


class TestTrainingSession(unittest.TestCase):
    """Tests for TrainingSession class."""

    def setUp(self):
        """Set up test fixtures."""
        self.user = User("testuser", "test@example.com", user_id=1)
        self.range_obj = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            hands={"AKs": Action(ActionType.RAISE), "TT": Action(ActionType.OPEN)},
            range_id=1,
        )

    @patch('poker_tool.objects.training.session.random.sample')
    def test_session_creation(self, mock_sample):
        """Test TrainingSession creation."""
        # Mock random.sample to return predictable results
        mock_sample.return_value = ["AKs", "TT"]

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=2,
            session_id=1,
        )

        self.assertEqual(session.user, self.user)
        self.assertEqual(session.range, self.range_obj)
        self.assertEqual(session.mode, "fill")
        self.assertEqual(session.total_questions, 2)
        self.assertEqual(session.id, 1)
        self.assertEqual(session.current_index, 0)
        self.assertEqual(session.correct_answers, 0)
        self.assertFalse(session.is_complete)

    @patch('poker_tool.objects.training.session.random.sample')
    def test_session_answer_correct(self, mock_sample):
        """Test answering a question correctly (one-question-per-hand mode)."""
        mock_sample.return_value = ["AKs", "TT"]

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="complete",
            total_questions=2,
            session_id=1,
        )

        # Answer first question correctly
        new_session = session.answer("raise")

        self.assertEqual(new_session.current_index, 1)
        self.assertEqual(new_session.correct_answers, 1)
        self.assertEqual(new_session.score, 100.0)
        self.assertFalse(new_session.is_complete)

    @patch('poker_tool.objects.training.session.random.sample')
    def test_session_answer_does_not_mutate_original(self, mock_sample):
        """Answering must not mutate the original session (true immutability)."""
        mock_sample.return_value = ["AKs", "TT"]

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=2,
            session_id=1,
        )
        original_index = session.current_index
        original_correct = session.correct_answers
        original_questions = list(session._questions)

        new_session = session.answer("raise")

        # The original session must be untouched.
        self.assertEqual(session.current_index, original_index)
        self.assertEqual(session.correct_answers, original_correct)
        self.assertEqual(session._questions, original_questions)
        # The clone must not share the questions list reference.
        self.assertIsNot(session._questions, new_session._questions)

    @patch('poker_tool.objects.training.session.random.sample')
    def test_session_answer_incorrect(self, mock_sample):
        """Test answering a question incorrectly (one-question-per-hand mode)."""
        mock_sample.return_value = ["AKs", "TT"]

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="complete",
            total_questions=2,
            session_id=1,
        )

        # Answer first question incorrectly
        new_session = session.answer("fold")

        self.assertEqual(new_session.current_index, 1)
        self.assertEqual(new_session.correct_answers, 0)
        self.assertEqual(new_session.score, 0.0)
        self.assertFalse(new_session.is_complete)

    @patch('poker_tool.objects.training.session.random.sample')
    def test_session_complete(self, mock_sample):
        """Test session completion (one-question-per-hand mode)."""
        mock_sample.return_value = ["AKs", "TT"]

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="complete",
            total_questions=2,
            session_id=1,
        )

        # Answer both questions
        session = session.answer("raise")
        session = session.answer("open")

        self.assertTrue(session.is_complete)
        self.assertEqual(session.current_index, 2)
        self.assertEqual(session.correct_answers, 2)
        self.assertEqual(session.score, 100.0)
        self.assertIsNotNone(session._ended_at)

    @patch('poker_tool.objects.training.session.random.sample')
    def test_session_end(self, mock_sample):
        """Test ending a session manually."""
        mock_sample.return_value = ["AKs", "TT"]

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=2,
            session_id=1,
        )

        # End session before completion
        ended_session = session.end()

        # After end(), the session should have _ended_at set
        self.assertIsNotNone(ended_session._ended_at)
        # Note: end() doesn't automatically mark as complete unless current_index >= total_questions
        # This is by design - end() just sets the end time

    @patch('poker_tool.objects.training.session.random.sample')
    def test_session_to_dict(self, mock_sample):
        """Test serialization to dictionary."""
        mock_sample.return_value = ["AKs", "TT"]

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=2,
            session_id=1,
        )

        session_dict = session.to_dict()

        self.assertEqual(session_dict["id"], 1)
        self.assertEqual(session_dict["user_id"], 1)
        self.assertEqual(session_dict["range_id"], 1)
        self.assertEqual(session_dict["mode"], "fill")
        self.assertEqual(session_dict["total_questions"], 2)
        self.assertEqual(session_dict["current_question_index"], 0)
        self.assertEqual(session_dict["correct_answers"], 0)
        self.assertEqual(session_dict["score"], 0.0)
        self.assertFalse(session_dict["is_complete"])
        self.assertIsNotNone(session_dict["start_time"])
        self.assertIsNone(session_dict["ended_at"])

    @patch('poker_tool.objects.training.session.random.sample')
    @patch('poker_tool.objects.training.session.datetime')
    def test_session_time_spent(self, mock_datetime, mock_sample):
        """Test time spent calculation."""
        mock_sample.return_value = ["AKs", "TT"]

        # Set up mock datetime
        start_time = datetime(2023, 1, 1, 12, 0, 0)
        end_time = datetime(2023, 1, 1, 12, 5, 30)

        mock_datetime.now.side_effect = [start_time, end_time]
        mock_datetime.fromisoformat = datetime.fromisoformat

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=2,
            session_id=1,
        )

        # Manually set end time for testing
        session._ended_at = end_time

        self.assertEqual(session.time_spent, 330)  # 5 minutes 30 seconds



class TestTrainingSessionGridMode(unittest.TestCase):
    """Tests for the grid-painting 'fill' mode."""

    def setUp(self):
        self.user = User("testuser", "test@example.com", user_id=1)
        self.range_obj = Range(
            name="Test Range",
            range_type=RangeType.PREFLOP,
            position=Position.BTN,
            hands={"AKs": Action(ActionType.RAISE), "TT": Action(ActionType.OPEN)},
            range_id=1,
        )

    def test_fill_generates_single_grid_question(self):
        """Mode 'fill' must produce a single grid_paint question."""
        import json

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=10,
            session_id=1,
        )
        self.assertEqual(len(session._questions), 1)
        question = session.current_question
        self.assertEqual(question.type, "grid_paint")
        self.assertEqual(question.hand, "grid")
        reference = json.loads(question.correct_answer)
        # The reference covers the whole 13x13 grid.
        self.assertEqual(len(reference), 169)
        self.assertEqual(reference["AKs"], "raise")
        self.assertEqual(reference["TT"], "open")
        # Hands absent from the range default to fold.
        self.assertEqual(reference["QQ"], "fold")

    def test_fill_perfect_grid_scores_full(self):
        """Submitting the exact reference grid scores 100%."""
        import json

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=10,
            session_id=1,
        )
        reference = json.loads(session.current_question.correct_answer)
        answered = session.answer(json.dumps(reference))
        self.assertTrue(answered.is_complete)
        self.assertEqual(answered.correct_answers, 169)
        self.assertEqual(answered.score, 100.0)

    def test_fill_empty_grid_scores_defaults(self):
        """An empty painted grid matches all default 'fold' cells."""
        import json

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=10,
            session_id=1,
        )
        answered = session.answer(json.dumps({}))
        self.assertTrue(answered.is_complete)
        # The range has 2 non-fold hands, so 169 - 2 = 167 fold cells match.
        self.assertEqual(answered.correct_answers, 167)

    def test_fill_answer_does_not_mutate_original(self):
        """Answering a grid must not mutate the original session."""
        import json

        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
            total_questions=10,
            session_id=1,
        )
        original_questions = list(session._questions)
        reference = json.loads(session.current_question.correct_answer)
        session.answer(json.dumps(reference))
        self.assertEqual(session._questions, original_questions)
        self.assertEqual(session.current_index, 0)

if __name__ == '__main__':
    unittest.main()
