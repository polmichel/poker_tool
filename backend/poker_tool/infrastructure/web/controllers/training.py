"""HTTP controllers for the training resource."""
from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest, NotFound

from ....interfaces.training_sessions import TrainingSessions
from ....use_cases.answer_question import AnswerQuestion
from ....use_cases.end_training_session import EndTrainingSession
from ....use_cases.errors import RangeHasNoHands, RangeNotFound, UserRequired
from ....use_cases.start_training_session import StartTrainingSession
from ....use_cases.training_errors import SessionNotFound


class TrainingController:
    """Thin HTTP controller for /api/training."""

    def __init__(self, sessions: TrainingSessions,
                 start_training: StartTrainingSession,
                 answer_question: AnswerQuestion,
                 end_training: EndTrainingSession) -> None:
        self._sessions = sessions
        self._start_training = start_training
        self._answer_question = answer_question
        self._end_training = end_training

    def register(self, api: Blueprint) -> None:
        @api.route("/training/sessions", methods=["POST"])
        def create_training_session():
            data = request.get_json()
            if not data or "mode" not in data or "range_id" not in data:
                raise BadRequest("Missing required fields: mode, range_id")
            try:
                result = self._start_training.start(
                    mode=data["mode"],
                    range_id=data["range_id"],
                    total_questions=data.get("total_questions", 10),
                    user_id=data.get("user_id"),
                )
            except RangeNotFound:
                raise NotFound(f"Range {data['range_id']} not found")
            except RangeHasNoHands as e:
                raise BadRequest(str(e))
            except UserRequired:
                raise BadRequest("User required")
            session = result.session
            return jsonify({
                "id": session.id,
                "session": session.to_dict(),
                "first_question": session.current_question.to_dict() if session.current_question else None,
            }), 201

        @api.route("/training/sessions", methods=["GET"])
        def list_training_sessions():
            sessions = self._sessions.all()
            return jsonify([s.to_dict() for s in sessions])

        @api.route("/training/sessions/<int:session_id>", methods=["GET"])
        def get_training_session(session_id: int):
            session = self._sessions.session_by_id(session_id)
            if not session:
                raise NotFound(f"Session {session_id} not found")
            return jsonify({
                "id": session.id,
                "session": session.to_dict(),
                "current_question": session.current_question.to_dict() if session.current_question else None,
                "progress": {
                    "current": session.current_index,
                    "total": session.total_questions,
                    "correct": session.correct_answers,
                    "score": session.score,
                },
            })

        @api.route("/training/sessions/<int:session_id>/start", methods=["POST"])
        def start_training_session(session_id: int):
            session = self._sessions.session_by_id(session_id)
            if not session:
                raise NotFound(f"Session {session_id} not found")
            return jsonify({
                "session": session.to_dict(),
                "first_question": session.current_question.to_dict() if session.current_question else None,
            })

        @api.route("/training/modes", methods=["GET"])
        def get_training_modes():
            return jsonify([
                {"value": "fill", "label": "Remplir une range"},
                {"value": "guess", "label": "Deviner une range"},
                {"value": "complete", "label": "Completer une range"},
            ])

        @api.route("/training/sessions/<int:session_id>/next", methods=["POST"])
        def next_question(session_id: int):
            data = request.get_json()
            if not data or "answer" not in data:
                raise BadRequest("Missing answer")
            try:
                result = self._answer_question.answer(session_id, data["answer"])
            except SessionNotFound:
                raise NotFound(f"Session {session_id} not found")
            return jsonify(result.response)

        @api.route("/training/sessions/<int:session_id>/end", methods=["POST"])
        def end_training_session(session_id: int):
            try:
                result = self._end_training.end(session_id)
            except SessionNotFound:
                raise NotFound(f"Session {session_id} not found")
            return jsonify({"message": "Session ended", "session": result.session.to_dict()})

        @api.route("/training/sessions/user/<int:user_id>", methods=["GET"])
        def get_user_sessions(user_id: int):
            sessions = self._sessions.sessions_by_user(user_id)
            return jsonify([s.to_dict() for s in sessions])
