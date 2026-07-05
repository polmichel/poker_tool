#!/usr/bin/env python3
"""
Test script to verify the fix for _generate_questions function.
This tests that when all hands are in the range, we can still generate enough questions.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.chdir(os.path.join(os.path.dirname(__file__), 'backend'))

# Now import from backend
from models.range import Range, RangeType, Position
from models.hand import Hand, ActionType, RANKS, generate_all_hands

# Mock RangeModel for testing
class MockRangeModel:
    def __init__(self, data):
        self.data = data
    
    def to_dict(self):
        return self.data

# Import the function we want to test
from routes.training import _generate_questions

def test_guess_mode_with_all_hands_in_range():
    """Test that guess mode generates enough questions when all hands are in range."""
    print("Testing guess mode with all hands in range...")
    
    # Create a range with ALL possible hands
    all_hands = generate_all_hands()
    range_data = {
        'id': 1,
        'name': 'Full Range',
        'range_type': RangeType.PUSH_FOLD.value,
        'position': Position.UTG.value,
        'hands': {h.to_string(): ActionType.RAISE.value for h in all_hands},
        'user_id': 1
    }
    
    range_obj = MockRangeModel(range_data)
    
    # Generate questions
    num_questions = 10
    questions = _generate_questions('guess', range_obj, num_questions=num_questions)
    
    print(f"  Requested: {num_questions} questions")
    print(f"  Generated: {len(questions)} questions")
    
    # Verify we got enough questions
    assert len(questions) == num_questions, f"Expected {num_questions} questions, got {len(questions)}"
    
    # Verify all questions are of type 'guess'
    for q in questions:
        assert q['type'] == 'guess', f"Expected type 'guess', got {q['type']}"
        assert q['correct_answer'] == 'true', f"Expected 'true' (hand in range), got {q['correct_answer']}"
    
    print("  ✓ All questions are of type 'guess'")
    print("  ✓ All answers are 'true' (hands in range)")
    print("  ✓ Test PASSED!\n")
    return True

def test_guess_mode_with_some_hands_in_range():
    """Test that guess mode works normally when some hands are in range and some are not."""
    print("Testing guess mode with some hands in range...")
    
    # Create a range with only a few hands
    all_hands = generate_all_hands()
    selected_hands = all_hands[:10]  # Only first 10 hands
    range_data = {
        'id': 2,
        'name': 'Partial Range',
        'range_type': RangeType.PUSH_FOLD.value,
        'position': Position.UTG.value,
        'hands': {h.to_string(): ActionType.RAISE.value for h in selected_hands},
        'user_id': 1
    }
    
    range_obj = MockRangeModel(range_data)
    
    # Generate questions
    num_questions = 10
    questions = _generate_questions('guess', range_obj, num_questions=num_questions)
    
    print(f"  Requested: {num_questions} questions")
    print(f"  Generated: {len(questions)} questions")
    
    # We should get approximately num_questions questions (could be slightly less if there aren't enough hands)
    assert len(questions) <= num_questions, f"Generated too many questions: {len(questions)}"
    assert len(questions) > 0, "No questions generated"
    
    # Count true/false answers
    true_count = sum(1 for q in questions if q['correct_answer'] == 'true')
    false_count = sum(1 for q in questions if q['correct_answer'] == 'false')
    
    print(f"  True answers: {true_count}")
    print(f"  False answers: {false_count}")
    
    # We should have a mix of true and false
    assert true_count > 0, "No true answers (hands in range)"
    assert false_count > 0, "No false answers (hands not in range)"
    
    print("  ✓ Mix of true and false answers")
    print("  ✓ Test PASSED!\n")
    return True

def test_fill_mode():
    """Test that fill mode still works."""
    print("Testing fill mode...")
    
    all_hands = generate_all_hands()
    range_data = {
        'id': 3,
        'name': 'Test Range',
        'range_type': RangeType.PUSH_FOLD.value,
        'position': Position.UTG.value,
        'hands': {h.to_string(): ActionType.RAISE.value for h in all_hands[:50]},
        'user_id': 1
    }
    
    range_obj = MockRangeModel(range_data)
    
    num_questions = 10
    questions = _generate_questions('fill', range_obj, num_questions=num_questions)
    
    print(f"  Requested: {num_questions} questions")
    print(f"  Generated: {len(questions)} questions")
    
    assert len(questions) == num_questions, f"Expected {num_questions} questions, got {len(questions)}"
    
    for q in questions:
        assert q['type'] == 'fill', f"Expected type 'fill', got {q['type']}"
    
    print("  ✓ All questions are of type 'fill'")
    print("  ✓ Test PASSED!\n")
    return True

def test_complete_mode():
    """Test that complete mode still works."""
    print("Testing complete mode...")
    
    all_hands = generate_all_hands()
    range_data = {
        'id': 4,
        'name': 'Test Range',
        'range_type': RangeType.PUSH_FOLD.value,
        'position': Position.UTG.value,
        'hands': {h.to_string(): ActionType.RAISE.value for h in all_hands[:50]},
        'user_id': 1
    }
    
    range_obj = MockRangeModel(range_data)
    
    num_questions = 10
    questions = _generate_questions('complete', range_obj, num_questions=num_questions)
    
    print(f"  Requested: {num_questions} questions")
    print(f"  Generated: {len(questions)} questions")
    
    # We might get fewer questions if there aren't enough hands in the range
    assert len(questions) <= num_questions, f"Generated too many questions: {len(questions)}"
    assert len(questions) > 0, "No questions generated"
    
    for q in questions:
        assert q['type'] == 'complete', f"Expected type 'complete', got {q['type']}"
    
    print("  ✓ All questions are of type 'complete'")
    print("  ✓ Test PASSED!\n")
    return True

if __name__ == '__main__':
    print("=" * 60)
    print("Testing _generate_questions fix")
    print("=" * 60 + "\n")
    
    try:
        test_guess_mode_with_all_hands_in_range()
        test_guess_mode_with_some_hands_in_range()
        test_fill_mode()
        test_complete_mode()
        
        print("=" * 60)
        print("ALL TESTS PASSED! ✓")
        print("=" * 60)
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
