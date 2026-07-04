"""
Unit tests for TrainingQuestion value object.
"""
import unittest
from poker_tool.objects.training.question import TrainingQuestion


class TestTrainingQuestion(unittest.TestCase):
    """Tests for TrainingQuestion class."""

    def test_question_creation(self):
        """Test TrainingQuestion creation."""
        question = TrainingQuestion("AKs", "What should you do with AKs?", "raise")
        self.assertEqual(question.hand, "AKs")
        self.assertEqual(question.question, "What should you do with AKs?")
        self.assertEqual(question.correct_answer, "raise")

    def test_is_correct(self):
        """Test is_correct method."""
        question = TrainingQuestion("AKs", "What should you do?", "raise")
        
        self.assertTrue(question.is_correct("raise"))
        self.assertTrue(question.is_correct("RAISE"))
        self.assertFalse(question.is_correct("fold"))
        self.assertFalse(question.is_correct("call"))

    def test_to_dict(self):
        """Test serialization to dictionary."""
        question = TrainingQuestion("AKs", "What should you do?", "raise")
        question_dict = question.to_dict()
        
        self.assertEqual(question_dict["hand"], "AKs")
        self.assertEqual(question_dict["question"], "What should you do?")
        self.assertEqual(question_dict["correct_answer"], "raise")

    def test_from_dict(self):
        """Test creation from dictionary."""
        data = {
            "hand": "AKs",
            "question": "What should you do?",
            "correct_answer": "raise",
        }
        question = TrainingQuestion.from_dict(data)
        
        self.assertEqual(question.hand, "AKs")
        self.assertEqual(question.question, "What should you do?")
        self.assertEqual(question.correct_answer, "raise")

    def test_equality(self):
        """Test equality comparison."""
        question1 = TrainingQuestion("AKs", "What should you do?", "raise")
        question2 = TrainingQuestion("AKs", "What should you do?", "raise")
        question3 = TrainingQuestion("AKo", "What should you do?", "raise")
        
        self.assertEqual(question1, question2)
        self.assertNotEqual(question1, question3)
        self.assertNotEqual(question1, "not a question")

    def test_hash(self):
        """Test hash for use in sets/dicts."""
        question1 = TrainingQuestion("AKs", "What should you do?", "raise")
        question2 = TrainingQuestion("AKs", "What should you do?", "raise")
        
        # Should be able to use in sets
        question_set = {question1, question2}
        self.assertEqual(len(question_set), 1)


if __name__ == '__main__':
    unittest.main()
