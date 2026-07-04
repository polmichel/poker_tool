"""
Training Service (Elegant Objects principles).
Orchestrates training session use cases using injected dependencies.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..domain.range import Range
from ..ports.database import DatabasePort


class TrainingSession:
    """Domain object for training sessions (simplified for now)."""
    
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
    ) -> TrainingSession:
        """Create a new training session."""
        session_data = {
            "user_id": user_id,
            "range_id": range_id,
            "mode": mode,
            "score": 0.0,
            "total_questions": 0,
            "correct_answers": 0,
            "time_spent": 0,
            "details": {},
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
        Returns: { is_correct: bool, correct_answer: str, next_question: dict | None }
        """
        # Get the session
        session = self.get_session_by_id(session_id)
        if not session:
            return {"error": "Session not found"}
        
        # Get the range for this session
        range_obj = None
        if session.range_id:
            range_obj = self.database.get_range_by_id(session.range_id)
        
        # For now, return a mock response
        # In a real implementation, this would:
        # 1. Get the current session
        # 2. Check the answer
        # 3. Get the next question
        # 4. Update session stats
        
        return {
            "is_correct": True,
            "correct_answer": "open",
            "next_question": None,
        }
    
    def end_session(self, session_id: int) -> Optional[TrainingSession]:
        """End a training session."""
        # Get the session
        session = self.get_session_by_id(session_id)
        if not session:
            return None
        
        # Update session in database
        session_data = {
            "id": session.id,
            "user_id": session.user_id,
            "range_id": session.range_id,
            "mode": session.mode,
            "score": session.score,
            "total_questions": session.total_questions,
            "correct_answers": session.correct_answers,
            "time_spent": session.time_spent,
            "details": session.details,
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
    
    def generate_questions(
        self,
        mode: str,
        range_obj: Range,
        num_questions: int = 10,
    ) -> List[Dict[str, Any]]:
        """Generate questions for a training session."""
        from ..domain.hand import generate_all_hands
        import random
        
        questions = []
        all_hands = generate_all_hands()
        
        if mode == "fill":
            selected_hands = random.sample(all_hands, min(num_questions, len(all_hands)))
            for hand in selected_hands:
                questions.append({
                    "type": "fill",
                    "hand": hand.to_string,
                    "question": f"Quelle action pour {hand.to_string} ?",
                    "correct_answer": "open",  # Simplified
                })
        
        return questions
