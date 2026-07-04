from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest, NotFound
from ..database import db, RangeModel, TrainingSession, User, Stat
from ..models.range import Range, RangeType, Position
from datetime import datetime, timedelta
import json


# Blueprint pour les routes liées aux statistiques
stats_bp = Blueprint("stats", __name__, url_prefix="/stats")


@stats_bp.route("/", methods=["GET"])
def get_global_stats():
    """Récupère les statistiques globales."""
    total_ranges = RangeModel.query.count()
    total_sessions = TrainingSession.query.count()
    total_users = User.query.count()
    
    # Calculer le score moyen
    sessions = TrainingSession.query.all()
    avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0
    
    # Calculer le temps total passé
    total_time = sum(s.time_spent for s in sessions)
    
    return jsonify({
        "total_ranges": total_ranges,
        "total_training_sessions": total_sessions,
        "total_users": total_users,
        "avg_score": avg_score,
        "total_time_spent": total_time,
    })


@stats_bp.route("/user/<int:user_id>", methods=["GET"])
def get_user_stats(user_id):
    """Récupère les statistiques d'un utilisateur."""
    user = User.query.get(user_id)
    if not user:
        raise NotFound(f"User with ID {user_id} not found")
    
    # Récupérer les ranges de l'utilisateur
    ranges = RangeModel.query.filter_by(user_id=user_id).all()
    
    # Récupérer les sessions d'entraînement de l'utilisateur
    sessions = TrainingSession.query.filter_by(user_id=user_id).all()
    
    # Calculer les statistiques
    total_ranges = len(ranges)
    total_sessions = len(sessions)
    avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0
    total_time = sum(s.time_spent for s in sessions)
    
    # Statistiques par mode d'entraînement
    mode_stats = {}
    for session in sessions:
        mode = session.mode
        if mode not in mode_stats:
            mode_stats[mode] = {
                "total_sessions": 0,
                "total_questions": 0,
                "correct_answers": 0,
                "avg_score": 0,
            }
        mode_stats[mode]["total_sessions"] += 1
        mode_stats[mode]["total_questions"] += session.total_questions
        mode_stats[mode]["correct_answers"] += session.correct_answers
        mode_stats[mode]["avg_score"] = (mode_stats[mode]["correct_answers"] / mode_stats[mode]["total_questions"]) * 100 if mode_stats[mode]["total_questions"] > 0 else 0
    
    # Statistiques par range
    range_stats = {}
    for session in sessions:
        range_id = session.range_id
        if range_id not in range_stats:
            range_stats[range_id] = {
                "total_sessions": 0,
                "total_questions": 0,
                "correct_answers": 0,
                "avg_score": 0,
            }
        range_stats[range_id]["total_sessions"] += 1
        range_stats[range_id]["total_questions"] += session.total_questions
        range_stats[range_id]["correct_answers"] += session.correct_answers
        range_stats[range_id]["avg_score"] = (range_stats[range_id]["correct_answers"] / range_stats[range_id]["total_questions"]) * 100 if range_stats[range_id]["total_questions"] > 0 else 0
    
    return jsonify({
        "user": user.to_dict(),
        "total_ranges": total_ranges,
        "total_training_sessions": total_sessions,
        "avg_score": avg_score,
        "total_time_spent": total_time,
        "mode_stats": mode_stats,
        "range_stats": range_stats,
    })


@stats_bp.route("/range/<int:range_id>", methods=["GET"])
def get_range_stats(range_id):
    """Récupère les statistiques d'une range."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    # Récupérer les sessions d'entraînement pour cette range
    sessions = TrainingSession.query.filter_by(range_id=range_id).all()
    
    # Calculer les statistiques
    total_sessions = len(sessions)
    avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0
    total_time = sum(s.time_spent for s in sessions)
    total_questions = sum(s.total_questions for s in sessions)
    correct_answers = sum(s.correct_answers for s in sessions)
    
    # Statistiques par mode
    mode_stats = {}
    for session in sessions:
        mode = session.mode
        if mode not in mode_stats:
            mode_stats[mode] = {
                "total_sessions": 0,
                "total_questions": 0,
                "correct_answers": 0,
                "avg_score": 0,
            }
        mode_stats[mode]["total_sessions"] += 1
        mode_stats[mode]["total_questions"] += session.total_questions
        mode_stats[mode]["correct_answers"] += session.correct_answers
        mode_stats[mode]["avg_score"] = (mode_stats[mode]["correct_answers"] / mode_stats[mode]["total_questions"]) * 100 if mode_stats[mode]["total_questions"] > 0 else 0
    
    return jsonify({
        "range": range_obj.to_dict(),
        "total_sessions": total_sessions,
        "avg_score": avg_score,
        "total_time_spent": total_time,
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "mode_stats": mode_stats,
    })


@stats_bp.route("/history", methods=["GET"])
def get_training_history():
    """Récupère l'historique des sessions d'entraînement."""
    # Récupérer toutes les sessions
    sessions = TrainingSession.query.order_by(TrainingSession.created_at.desc()).all()
    
    history = []
    for session in sessions:
        range_obj = RangeModel.query.get(session.range_id)
        user = User.query.get(session.user_id) if session.user_id else None
        
        history.append({
            "session_id": session.id,
            "user": user.to_dict() if user else None,
            "range": range_obj.to_dict() if range_obj else None,
            "mode": session.mode,
            "score": session.score,
            "total_questions": session.total_questions,
            "correct_answers": session.correct_answers,
            "time_spent": session.time_spent,
            "created_at": session.created_at.isoformat() if session.created_at else None,
        })
    
    return jsonify(history)


@stats_bp.route("/leaderboard", methods=["GET"])
def get_leaderboard():
    """Récupère le classement des utilisateurs."""
    # Récupérer tous les utilisateurs avec leurs statistiques
    users = User.query.all()
    leaderboard = []
    
    for user in users:
        sessions = TrainingSession.query.filter_by(user_id=user.id).all()
        total_sessions = len(sessions)
        avg_score = sum(s.score for s in sessions) / len(sessions) if sessions else 0
        total_time = sum(s.time_spent for s in sessions)
        
        leaderboard.append({
            "user": user.to_dict(),
            "total_sessions": total_sessions,
            "avg_score": avg_score,
            "total_time_spent": total_time,
        })
    
    # Trier par score moyen (descendant)
    leaderboard.sort(key=lambda x: x["avg_score"], reverse=True)
    
    return jsonify(leaderboard)


@stats_bp.route("/range/<int:range_id>/progress", methods=["GET"])
def get_range_progress(range_id):
    """Récupère la progression pour une range spécifique."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    # Récupérer les sessions pour cette range
    sessions = TrainingSession.query.filter_by(range_id=range_id).all()
    
    # Calculer la progression
    progress = {
        "range": range_obj.to_dict(),
        "total_sessions": len(sessions),
        "sessions": [s.to_dict() for s in sessions],
        "avg_score": sum(s.score for s in sessions) / len(sessions) if sessions else 0,
        "total_time_spent": sum(s.time_spent for s in sessions),
    }
    
    return jsonify(progress)


@stats_bp.route("/export", methods=["GET"])
def export_stats():
    """Exporte les statistiques dans différents formats."""
    format_type = request.args.get("format", "json")
    
    # Récupérer toutes les données
    ranges = RangeModel.query.all()
    sessions = TrainingSession.query.all()
    users = User.query.all()
    
    data = {
        "ranges": [r.to_dict() for r in ranges],
        "training_sessions": [s.to_dict() for s in sessions],
        "users": [u.to_dict() for u in users],
        "metadata": {
            "export_date": datetime.utcnow().isoformat(),
            "total_ranges": len(ranges),
            "total_sessions": len(sessions),
            "total_users": len(users),
        }
    }
    
    if format_type == "json":
        return jsonify(data)
    elif format_type == "csv":
        # Convertir en CSV (simplifié)
        csv_lines = []
        
        # En-tête pour les ranges
        csv_lines.append("Type,ID,Name,Description,Range Type,Position,Total Hands,Created At")
        for r in ranges:
            csv_lines.append(f"Range,{r.id},{r.name},{r.description},{r.range_type.value if r.range_type else ''},{r.position.value if r.position else ''},{len(r.hands or {})},{r.created_at}")
        
        # En-tête pour les sessions
        csv_lines.append("\nType,ID,User ID,Range ID,Mode,Score,Total Questions,Correct Answers,Time Spent,Created At")
        for s in sessions:
            csv_lines.append(f"Session,{s.id},{s.user_id},{s.range_id},{s.mode},{s.score},{s.total_questions},{s.correct_answers},{s.time_spent},{s.created_at}")
        
        return jsonify({"csv": "\n".join(csv_lines)})
    else:
        raise BadRequest(f"Unsupported format: {format_type}")


@stats_bp.route("/backup", methods=["GET"])
def backup_all_data():
    """Sauvegarde toutes les données (ranges, sessions, utilisateurs)."""
    import os
    from ..database import backup_db
    from flask import current_app
    
    # Créer un dossier de backup s'il n'existe pas
    backup_dir = os.path.join(current_app.root_path, "backups")
    os.makedirs(backup_dir, exist_ok=True)
    
    # Générer un nom de fichier unique
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f"poker_tool_backup_{timestamp}.json")
    
    # Sauvegarder les données
    backup_db(current_app._get_current_object(), backup_path)
    
    return jsonify({
        "message": "Backup created successfully",
        "backup_path": backup_path,
    })
