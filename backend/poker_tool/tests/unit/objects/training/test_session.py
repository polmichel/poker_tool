"""
Unit tests for TrainingSession entity.
"""
import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from poker_tool.objects.user import User
from poker_tool.objects.range import Range
from poker_tool.objects.range_type import RangeType
from poker_tool.objects.position import Position
from poker_tool.objects.action import Action, ActionType
from poker_tool.objects.training.session import TrainingSession


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
        """Test answering a question correctly."""
        mock_sample.return_value = ["AKs", "TT"]
        
        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
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
    def test_session_answer_incorrect(self, mock_sample):
        """Test answering a question incorrectly."""
        mock_sample.return_value = ["AKs", "TT"]
        
        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
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
        """Test session completion."""
        mock_sample.return_value = ["AKs", "TT"]
        
        session = TrainingSession(
            user=self.user,
            range_obj=self.range_obj,
            mode="fill",
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
        
        mock_datetime.utcnow.side_effect = [start_time, end_time]
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


if __name__ == '__main__':
    unittest.main()
