"""
Training Service (Elegant Objects principles).
Orchestrates training session use cases using injected dependencies.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import random
from ..domain.range import Range
from ..domain.hand import RANKS, generate_all_hands
from ..ports.database import DatabasePort


class TrainingQuestion:
    """Represents a training question."""
    
    def __init__(
        self,
        hand: str,
        question: str,
        correct_answer: str,
        question_type: str = "fill",
    ):
        self.hand = hand
        self.question = question
        self.correct_answer = correct_answer
        self.question_type = question_type
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "hand": self.hand,
            "question": self.question,
            "correct_answer": self.correct_answer,
            "type": self.question_type,
        }


class TrainingSession:
    """Domain object for training sessions."""
    
    def __init__(
        self,
        id: Optional[int] = None,
        user_id: Optional[int] = None,
        range_id: Optional[int] = None,
        mode: str = "",
        score: float = 0.0,
        total_questions: int = 0,
        correct_answers: int = 0,
        time_spent: int = 0,
        details: Dict = None,
        created_at: Optional[str] = None,
    ):
        self.id = id
        self.user_id = user_id
        self.range_id = range_id
        self.mode = mode
        self.score = score
        self.total_questions = total_questions
        self.correct_answers = correct_answers
        self.time_spent = time_spent
        self.details = details or {}
        self.created_at = created_at


class TrainingService:
    """Service for managing training sessions."""
    
    def __init__(self, database: DatabasePort):
        """Inject database dependency."""
        self.database = database
    
    def create_session(
        self,
        user_id: int,
        range_id: int,
        mode: str = "fill",
        total_questions: int = 10,
    ) -> TrainingSession:
        """Create a new training session."""
        # Get the range to generate questions
        range_obj = self.database.get_range_by_id(range_id)
        
        # Generate initial questions
        questions = self._generate_questions(mode, range_obj, total_questions)
        
        session_data = {
            "user_id": user_id,
            "range_id": range_id,
            "mode": mode,
            "score": 0.0,
            "total_questions": total_questions,
            "correct_answers": 0,
            "time_spent": 0,
            "details": {
                "questions": [q.to_dict() for q in questions],
                "current_question_index": 0,
                "start_time": datetime.utcnow().isoformat(),
            },
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Save to database
        saved_session = self.database.save_training_session(session_data)
        
        # Convert back to TrainingSession object
        return TrainingSession(
            id=saved_session.get("id"),
            user_id=saved_session.get("user_id"),
            range_id=saved_session.get("range_id"),
            mode=saved_session.get("mode", ""),
            score=saved_session.get("score", 0.0),
            total_questions=saved_session.get("total_questions", 0),
            correct_answers=saved_session.get("correct_answers", 0),
            time_spent=saved_session.get("time_spent", 0),
            details=saved_session.get("details", {}),
            created_at=saved_session.get("created_at"),
        )
    
    def get_session_by_id(self, session_id: int) -> Optional[TrainingSession]:
        """Get a training session by ID."""
        session_data = self.database.get_training_session_by_id(session_id)
        if not session_data:
            return None
        
        return TrainingSession(
            id=session_data.get("id"),
            user_id=session_data.get("user_id"),
            range_id=session_data.get("range_id"),
            mode=session_data.get("mode", ""),
            score=session_data.get("score", 0.0),
            total_questions=session_data.get("total_questions", 0),
            correct_answers=session_data.get("correct_answers", 0),
            time_spent=session_data.get("time_spent", 0),
            details=session_data.get("details", {}),
            created_at=session_data.get("created_at"),
        )
    
    def get_all_sessions(self) -> List[TrainingSession]:
        """Get all training sessions."""
        sessions_data = self.database.get_all_training_sessions()
        return [
            TrainingSession(
                id=s.get("id"),
                user_id=s.get("user_id"),
                range_id=s.get("range_id"),
                mode=s.get("mode", ""),
                score=s.get("score", 0.0),
                total_questions=s.get("total_questions", 0),
                correct_answers=s.get("correct_answers", 0),
                time_spent=s.get("time_spent", 0),
                details=s.get("details", {}),
                created_at=s.get("created_at"),
            )
            for s in sessions_data
        ]
    
    def get_sessions_by_user(self, user_id: int) -> List[TrainingSession]:
        """Get all training sessions for a specific user."""
        sessions_data = self.database.get_training_sessions_by_user(user_id)
        return [
            TrainingSession(
                id=s.get("id"),
                user_id=s.get("user_id"),
                range_id=s.get("range_id"),
                mode=s.get("mode", ""),
                score=s.get("score", 0.0),
                total_questions=s.get("total_questions", 0),
                correct_answers=s.get("correct_answers", 0),
                time_spent=s.get("time_spent", 0),
                details=s.get("details", {}),
                created_at=s.get("created_at"),
            )
            for s in sessions_data
        ]
    
    def next_question(
        self,
        session_id: int,
        answer: str,
    ) -> Dict[str, Any]:
        """
        Process the next question in a training session.
        Returns: {
            is_correct: bool,
            correct_answer: str,
            current_question: dict,
            next_question: dict | None,
            session_complete: bool,
            progress: { current: int, total: int, correct: int, score: float }
        }
        """
        # Get the session
        session = self.get_session_by_id(session_id)
        if not session:
            return {"error": "Session not found"}
        
        # Get the range for this session
        range_obj = None
        if session.range_id:
            range_obj = self.database.get_range_by_id(session.range_id)
        
        # Get session details
        details = session.details or {}
        questions = details.get("questions", [])
        current_index = details.get("current_question_index", 0)
        start_time = details.get("start_time")
        
        # Check if session is complete
        if current_index >= len(questions) or current_index >= session.total_questions:
            return {
                "error": "Session already complete",
                "session_complete": True,
                "progress": {
                    "current": session.total_questions,
                    "total": session.total_questions,
                    "correct": session.correct_answers,
                    "score": session.score,
                }
            }
        
        # Get current question
        current_question = questions[current_index] if current_index < len(questions) else None
        
        # Check the answer
        is_correct = False
        correct_answer = ""
        
        if current_question:
            # The correct answer is stored in the question
            correct_answer = current_question.get("correct_answer", "")
            is_correct = (answer.lower() == correct_answer.lower())
            
            # Update session stats
            new_correct = session.correct_answers + (1 if is_correct else 0)
            new_total = session.total_questions
            
            # Calculate score (percentage)
            new_score = (new_correct / max(new_total, 1)) * 100
            
            # Calculate time spent
            time_spent = session.time_spent
            if start_time:
                try:
                    start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    time_spent = int((datetime.utcnow() - start_dt).total_seconds())
                except:
                    time_spent = session.time_spent
            
            # Prepare next question
            next_index = current_index + 1
            next_question = None
            session_complete = False
            
            if next_index < len(questions) and next_index < session.total_questions:
                next_question = questions[next_index]
            else:
                session_complete = True
            
            # Update session in database
            updated_details = {
                "questions": questions,
                "current_question_index": next_index,
                "start_time": start_time,
                "last_answer": answer,
                "last_correct": is_correct,
            }
            
            updated_session_data = {
                "id": session.id,
                "user_id": session.user_id,
                "range_id": session.range_id,
                "mode": session.mode,
                "score": round(new_score, 2),
                "total_questions": new_total,
                "correct_answers": new_correct,
                "time_spent": time_spent,
                "details": updated_details,
                "created_at": session.created_at,
            }
            
            self.database.update_training_session(session_id, updated_session_data)
            
            return {
                "is_correct": is_correct,
                "correct_answer": correct_answer,
                "current_question": current_question,
                "next_question": next_question,
                "session_complete": session_complete,
                "progress": {
                    "current": next_index,
                    "total": session.total_questions,
                    "correct": new_correct,
                    "score": round(new_score, 2),
                }
            }
        
        return {
            "error": "No current question found",
            "session_complete": False,
            "progress": {
                "current": current_index,
                "total": session.total_questions,
                "correct": session.correct_answers,
            }
        }
    
    def end_session(self, session_id: int) -> Optional[TrainingSession]:
        """End a training session."""
        # Get the session
        session = self.get_session_by_id(session_id)
        if not session:
            return None
        
        # Update session in database
        details = session.details or {}
        details["ended_at"] = datetime.utcnow().isoformat()
        
        session_data = {
            "id": session.id,
            "user_id": session.user_id,
            "range_id": session.range_id,
            "mode": session.mode,
            "score": session.score,
            "total_questions": session.total_questions,
            "correct_answers": session.correct_answers,
            "time_spent": session.time_spent,
            "details": details,
            "created_at": session.created_at,
        }
        
        updated_session = self.database.update_training_session(session_id, session_data)
        if not updated_session:
            return None
        
        return TrainingSession(
            id=updated_session.get("id"),
            user_id=updated_session.get("user_id"),
            range_id=updated_session.get("range_id"),
            mode=updated_session.get("mode", ""),
            score=updated_session.get("score", 0.0),
            total_questions=updated_session.get("total_questions", 0),
            correct_answers=updated_session.get("correct_answers", 0),
            time_spent=updated_session.get("time_spent", 0),
            details=updated_session.get("details", {}),
            created_at=updated_session.get("created_at"),
        )
    
    def get_session_results(self, session_id: int) -> Dict[str, Any]:
        """Get results for a training session."""
        session = self.get_session_by_id(session_id)
        if not session:
            return {"error": "Session not found"}
        
        return {
            "score": session.score,
            "total_questions": session.total_questions,
            "correct_answers": session.correct_answers,
            "time_spent": session.time_spent,
        }
    
    def _generate_questions(
        self,
        mode: str,
        range_obj: Optional[Range],
        num_questions: int = 10,
    ) -> List[TrainingQuestion]:
        """Generate questions for a training session."""
        questions = []
        
        if not range_obj:
            # If no range, generate questions with random actions
            all_hands = generate_all_hands()
            selected_hands = random.sample(all_hands, min(num_questions, len(all_hands)))
            
            for hand in selected_hands:
                # Random action for demo purposes
                actions = ['open', 'call', 'raise', 'fold', 'all_in']
                correct_action = random.choice(actions)
                
                questions.append(TrainingQuestion(
                    hand=hand.to_string,
                    question=f"Quelle action pour {hand.to_string} ?",
                    correct_answer=correct_action,
                    question_type=mode,
                ))
        else:
            # Use the range's hands to generate questions
            # Get all hands from the range
            range_hands = range_obj.hands
            
            # Generate a mix of hands from the range and random hands
            all_possible_hands = generate_all_hands()
            
            # Select hands that are in the range
            range_hand_strings = [hand_str for hand_str in range_hands.keys()]
            
            # If we have enough hands in the range, use them
            if len(range_hand_strings) >= num_questions:
                selected_hand_strings = random.sample(range_hand_strings, num_questions)
            else:
                # Mix range hands with random hands
                remaining = num_questions - len(range_hand_strings)
                other_hands = [h.to_string for h in all_possible_hands 
                             if h.to_string not in range_hand_strings]
                extra_hands = random.sample(other_hands, min(remaining, len(other_hands)))
                selected_hand_strings = range_hand_strings + extra_hands
            
            for hand_str in selected_hand_strings:
                # Get the action from the range, or use 'fold' if not in range
                action = range_hands.get(hand_str)
                if action:
                    correct_answer = action.name.lower()
                else:
                    # For hands not in range, the correct answer is 'fold'
                    correct_answer = 'fold'
                
                questions.append(TrainingQuestion(
                    hand=hand_str,
                    question=f"Quelle action pour {hand_str} ?",
                    correct_answer=correct_answer,
                    question_type=mode,
                ))
        
        return questions
