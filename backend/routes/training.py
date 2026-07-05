from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, NotFound
import os
import sys

# Ajouter le dossier backend au path pour les imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from database import db, RangeModel, TrainingSession, User
from models.range import Range, RangeType, Position
from models.hand import Hand, ActionType, RANKS, generate_all_hands
from datetime import datetime
import random


# Blueprint pour les routes liées à l'entraînement
training_bp = Blueprint("training", __name__, url_prefix="/training")


@training_bp.route("/modes", methods=["GET"])
def get_training_modes():
    """Récupère les modes d'entraînement disponibles."""
    modes = [
        {
            "id": "fill",
            "name": "Remplir une range",
            "description": "Compléter une grille de range vide avec les bonnes actions.",
        },
        {
            "id": "guess",
            "name": "Deviner une range",
            "description": "Déterminer si des mains font partie d'une range donnée.",
        },
        {
            "id": "complete",
            "name": "Compléter une range",
            "description": "Compléter une range partiellement remplie.",
        },
    ]
    return jsonify(modes)


@training_bp.route("/sessions", methods=["GET"])
def get_training_sessions():
    """Récupère toutes les sessions d'entraînement."""
    sessions = TrainingSession.query.all()
    return jsonify([s.to_dict() for s in sessions])


@training_bp.route("/sessions/<int:session_id>", methods=["GET"])
def get_training_session(session_id):
    """Récupère une session d'entraînement spécifique."""
    session = TrainingSession.query.get(session_id)
    if not session:
        raise NotFound(f"Training session with ID {session_id} not found")
    return jsonify(session.to_dict())


@training_bp.route("/sessions", methods=["POST"])
def create_training_session():
    """Crée une nouvelle session d'entraînement."""
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")
    
    required_fields = ["mode", "range_id"]
    for field in required_fields:
        if field not in data:
            raise BadRequest(f"Missing required field: {field}")
    
    session = TrainingSession(
        user_id=data.get("user_id"),
        range_id=data["range_id"],
        mode=data["mode"],
        score=0.0,
        total_questions=0,
        correct_answers=0,
        time_spent=0,
        details={},
    )
    
    db.session.add(session)
    db.session.commit()
    
    return jsonify(session.to_dict()), 201


@training_bp.route("/sessions/<int:session_id>/start", methods=["POST"])
def start_training_session(session_id):
    """Démarre une session d'entraînement."""
    session = TrainingSession.query.get(session_id)
    if not session:
        raise NotFound(f"Training session with ID {session_id} not found")
    
    range_obj = RangeModel.query.get(session.range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {session.range_id} not found")
    
    # Générer des questions en fonction du mode
    questions = _generate_questions(session.mode, range_obj)
    
    session.details = {
        "questions": questions,
        "current_question": 0,
        "start_time": datetime.utcnow().isoformat(),
    }
    db.session.commit()
    
    return jsonify({
        "session": session.to_dict(),
        "first_question": questions[0] if questions else None,
    })


@training_bp.route("/sessions/<int:session_id>/next", methods=["POST"])
def next_training_question(session_id):
    """Passe à la question suivante dans une session d'entraînement."""
    session = TrainingSession.query.get(session_id)
    if not session:
        raise NotFound(f"Training session with ID {session_id} not found")
    
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")
    
    current_question = session.details.get("current_question", 0)
    questions = session.details.get("questions", [])
    
    if current_question >= len(questions):
        raise BadRequest("No more questions in this session")
    
    # Vérifier la réponse
    user_answer = data.get("answer")
    correct_answer = questions[current_question].get("correct_answer")
    is_correct = user_answer == correct_answer
    
    # Mettre à jour les statistiques
    session.total_questions += 1
    if is_correct:
        session.correct_answers += 1
    
    # Calculer le score
    session.score = (session.correct_answers / session.total_questions) * 100 if session.total_questions > 0 else 0
    
    # Passer à la question suivante
    session.details["current_question"] = current_question + 1
    
    # Mettre à jour le temps écoulé
    start_time = datetime.fromisoformat(session.details.get("start_time", datetime.utcnow().isoformat()))
    session.time_spent = int((datetime.utcnow() - start_time).total_seconds())
    
    db.session.commit()
    
    # Retourner la question suivante (ou None si c'est la fin)
    next_question = questions[current_question + 1] if current_question + 1 < len(questions) else None
    
    return jsonify({
        "session": session.to_dict(),
        "is_correct": is_correct,
        "correct_answer": correct_answer,
        "next_question": next_question,
    })


@training_bp.route("/sessions/<int:session_id>/end", methods=["POST"])
def end_training_session(session_id):
    """Termine une session d'entraînement."""
    session = TrainingSession.query.get(session_id)
    if not session:
        raise NotFound(f"Training session with ID {session_id} not found")
    
    # Mettre à jour le temps écoulé
    start_time = datetime.fromisoformat(session.details.get("start_time", datetime.utcnow().isoformat()))
    session.time_spent = int((datetime.utcnow() - start_time).total_seconds())
    
    db.session.commit()
    
    return jsonify({
        "session": session.to_dict(),
        "message": "Training session ended successfully",
    })


@training_bp.route("/sessions/<int:session_id>/results", methods=["GET"])
def get_training_results(session_id):
    """Récupère les résultats d'une session d'entraînement."""
    session = TrainingSession.query.get(session_id)
    if not session:
        raise NotFound(f"Training session with ID {session_id} not found")
    
    range_obj = RangeModel.query.get(session.range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {session.range_id} not found")
    
    return jsonify({
        "session": session.to_dict(),
        "range": range_obj.to_dict(),
        "stats": {
            "score": session.score,
            "total_questions": session.total_questions,
            "correct_answers": session.correct_answers,
            "time_spent": session.time_spent,
            "accuracy": session.score,
        }
    })


def _generate_questions(mode: str, range_obj: RangeModel, num_questions: int = 10) -> list:
    """Génère des questions pour une session d'entraînement."""
    range_instance = Range.from_dict(range_obj.to_dict())
    all_hands = generate_all_hands()
    
    questions = []
    
    if mode == "fill":
        # Mode "Remplir une range" : l'utilisateur doit remplir une grille vide
        # On sélectionne des mains aléatoires et on demande leur action
        selected_hands = random.sample(all_hands, min(num_questions, len(all_hands)))
        for hand in selected_hands:
            questions.append({
                "type": "fill",
                "hand": hand.to_string(),
                "question": f"Quelle action pour {hand.to_string()} ?",
                "correct_answer": range_instance.get_action(hand).value,
            })
    
    elif mode == "guess":
        # Mode "Deviner une range" : l'utilisateur doit deviner si une main fait partie de la range
        # On mélange des mains dans la range et des mains hors de la range
        range_hands = list(range_instance.hands.keys())
        non_range_hands = [h.to_string() for h in all_hands if h.to_string() not in range_hands]
        
        # Sélectionner des mains dans et hors de la range
        # Si il n'y a pas de mains hors de la range, on prend toutes les questions dans la range
        if len(non_range_hands) == 0:
            # Toutes les mains sont dans la range, on prend uniquement des mains de la range
            selected_hands = random.sample(range_hands, min(num_questions, len(range_hands)))
        else:
            selected_in_range = random.sample(range_hands, min(num_questions // 2, len(range_hands)))
            selected_out_range = random.sample(non_range_hands, min(num_questions // 2, len(non_range_hands)))
            selected_hands = selected_in_range + selected_out_range
        
        for hand_str in selected_hands:
            is_in_range = hand_str in range_instance.hands
            questions.append({
                "type": "guess",
                "hand": hand_str,
                "question": f"Est-ce que {hand_str} fait partie de cette range ?",
                "correct_answer": str(is_in_range).lower(),
            })
    
    elif mode == "complete":
        # Mode "Compléter une range" : l'utilisateur doit compléter une range partiellement remplie
        # On sélectionne des mains de la range et on en cache certaines
        range_hands = list(range_instance.hands.items())
        selected_hands = random.sample(range_hands, min(num_questions, len(range_hands)))
        
        for hand_str, action in selected_hands:
            questions.append({
                "type": "complete",
                "hand": hand_str,
                "question": f"Quelle est l'action pour {hand_str} dans cette range ?",
                "correct_answer": action,
            })
    
    return questions


@training_bp.route("/quick-start", methods=["POST"])
def quick_start_training():
    """Démarre rapidement une session d'entraînement avec des paramètres par défaut."""
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")
    
    mode = data.get("mode", "fill")
    range_id = data.get("range_id")
    
    if not range_id:
        # Utiliser la première range disponible
        range_obj = RangeModel.query.first()
        if not range_obj:
            raise BadRequest("No ranges available. Please create a range first.")
        range_id = range_obj.id
    
    # Créer une session
    session = TrainingSession(
        user_id=data.get("user_id"),
        range_id=range_id,
        mode=mode,
        score=0.0,
        total_questions=0,
        correct_answers=0,
        time_spent=0,
        details={},
    )
    
    db.session.add(session)
    db.session.commit()
    
    # Démarrer la session
    range_obj = RangeModel.query.get(range_id)
    questions = _generate_questions(mode, range_obj)
    
    session.details = {
        "questions": questions,
        "current_question": 0,
        "start_time": datetime.utcnow().isoformat(),
    }
    db.session.commit()
    
    return jsonify({
        "session": session.to_dict(),
        "first_question": questions[0] if questions else None,
    })
