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
        session = TrainingSession(
            user_id=user_id,
            range_id=range_id,
            mode=mode,
            score=0.0,
            total_questions=0,
            correct_answers=0,
            time_spent=0,
            details={},
            created_at=datetime.utcnow().isoformat(),
        )
        # In a real implementation, we would save to DB
        # For now, we return the session object
        return session
    
    def get_session_by_id(self, session_id: int) -> Optional[TrainingSession]:
        """Get a training session by ID."""
        # Placeholder - in real implementation, fetch from DB
        return None
    
    def get_all_sessions(self) -> List[TrainingSession]:
        """Get all training sessions."""
        # Placeholder - in real implementation, fetch from DB
        return []
    
    def next_question(
        self,
        session_id: int,
        answer: str,
    ) -> Dict[str, Any]:
        """
        Process the next question in a training session.
        Returns: { is_correct: bool, correct_answer: str, next_question: dict | None }
        """
        # Placeholder implementation
        # In a real implementation, this would:
        # 1. Get the current session
        # 2. Check the answer
        # 3. Get the next question
        # 4. Update session stats
        
        # For now, return a mock response
        return {
            "is_correct": True,
            "correct_answer": "open",
            "next_question": None,
        }
    
    def end_session(self, session_id: int) -> Optional[TrainingSession]:
        """End a training session."""
        # Placeholder - in real implementation, update DB
        return None
    
    def get_session_results(self, session_id: int) -> Dict[str, Any]:
        """Get results for a training session."""
        # Placeholder
        return {
            "score": 0,
            "total_questions": 0,
            "correct_answers": 0,
            "time_spent": 0,
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
