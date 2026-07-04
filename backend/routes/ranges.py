from flask import Blueprint, request, jsonify, current_app
from werkzeug.exceptions import BadRequest, NotFound
import os
import sys

# Ajouter le dossier backend au path pour les imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from database import db, RangeModel, ScenarioModel, User
from models.range import Range, RangeType, Position
from models.hand import Hand, ActionType, RANKS, generate_all_hands
from models.scenario import Scenario, ScenarioType
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
import json
from datetime import datetime


# Blueprint pour les routes liées aux ranges
range_bp = Blueprint("ranges", __name__, url_prefix="/ranges")


@range_bp.route("/", methods=["GET"])
def get_all_ranges():
    """Récupère toutes les ranges."""
    ranges = RangeModel.query.all()
    return jsonify([r.to_dict() for r in ranges])


@range_bp.route("/<int:range_id>", methods=["GET"])
def get_range(range_id):
    """Récupère une range spécifique."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    return jsonify(range_obj.to_dict())


@range_bp.route("/", methods=["POST"])
def create_range():
    """Crée une nouvelle range."""
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")
    
    # Valider les données
    required_fields = ["name"]
    for field in required_fields:
        if field not in data:
            raise BadRequest(f"Missing required field: {field}")
    
    # Créer la range
    range_obj = RangeModel(
        name=data["name"],
        description=data.get("description", ""),
        range_type=RangeType(data.get("range_type", "preflop")),
        position=Position(data.get("position", "undefined")),
        hands=data.get("hands", {}),
        user_id=data.get("user_id"),
    )
    
    db.session.add(range_obj)
    db.session.commit()
    
    return jsonify(range_obj.to_dict()), 201


@range_bp.route("/<int:range_id>", methods=["PUT"])
def update_range(range_id):
    """Met à jour une range existante."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")
    
    # Mettre à jour les champs
    if "name" in data:
        range_obj.name = data["name"]
    if "description" in data:
        range_obj.description = data["description"]
    if "range_type" in data:
        range_obj.range_type = RangeType(data["range_type"])
    if "position" in data:
        range_obj.position = Position(data["position"])
    if "hands" in data:
        range_obj.hands = data["hands"]
    
    range_obj.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(range_obj.to_dict())


@range_bp.route("/<int:range_id>", methods=["DELETE"])
def delete_range(range_id):
    """Supprime une range."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    db.session.delete(range_obj)
    db.session.commit()
    
    return jsonify({"message": f"Range with ID {range_id} deleted successfully"}), 200


@range_bp.route("/<int:range_id>/grid", methods=["GET"])
def get_range_grid(range_id):
    """Récupère la grille 13x13 d'une range."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    # Créer une Range à partir des données
    range_data = range_obj.to_dict()
    range_instance = Range.from_dict(range_data)
    
    # Générer la grille
    grid = range_instance.get_grid()
    
    return jsonify({
        "range": range_data,
        "grid": grid,
    })


@range_bp.route("/<int:range_id>/stats", methods=["GET"])
def get_range_stats(range_id):
    """Récupère les statistiques d'une range."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    range_data = range_obj.to_dict()
    range_instance = Range.from_dict(range_data)
    stats = range_instance.get_statistics()
    
    return jsonify({
        "range": range_data,
        "stats": stats,
    })


@range_bp.route("/<int:range_id>/hands/<hand_str>", methods=["PUT"])
def update_hand_action(range_id, hand_str):
    """Met à jour l'action d'une main dans une range."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    data = request.get_json()
    if not data or "action" not in data:
        raise BadRequest("Missing action field")
    
    action = data["action"]
    try:
        action_type = ActionType(action)
    except ValueError:
        raise BadRequest(f"Invalid action: {action}")
    
    # Mettre à jour les mains
    if not range_obj.hands:
        range_obj.hands = {}
    
    range_obj.hands[hand_str] = action_type.value
    range_obj.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify(range_obj.to_dict())


@range_bp.route("/<int:range_id>/hands/<hand_str>", methods=["DELETE"])
def remove_hand_from_range(range_id, hand_str):
    """Retire une main d'une range."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    if range_obj.hands and hand_str in range_obj.hands:
        del range_obj.hands[hand_str]
        range_obj.updated_at = datetime.utcnow()
        db.session.commit()
    
    return jsonify(range_obj.to_dict())


@range_bp.route("/export/<int:range_id>", methods=["GET"])
def export_range(range_id):
    """Exporte une range dans différents formats."""
    range_obj = RangeModel.query.get(range_id)
    if not range_obj:
        raise NotFound(f"Range with ID {range_id} not found")
    
    format_type = request.args.get("format", "json")
    range_data = range_obj.to_dict()
    range_instance = Range.from_dict(range_data)
    
    if format_type == "json":
        return jsonify(range_instance.to_dict())
    elif format_type == "text":
        lines = []
        for hand_str, action in range_instance.hands.items():
            lines.append(f"{hand_str}: {action}")
        return jsonify({"text": "\n".join(lines)})
    elif format_type == "csv":
        csv_lines = ["hand,action"]
        for hand_str, action in range_instance.hands.items():
            csv_lines.append(f"{hand_str},{action}")
        return jsonify({"csv": "\n".join(csv_lines)})
    else:
        raise BadRequest(f"Unsupported format: {format_type}")


@range_bp.route("/import", methods=["POST"])
def import_range():
    """Importe une range depuis un fichier."""
    data = request.get_json()
    if not data:
        raise BadRequest("No data provided")
    
    format_type = data.get("format", "json")
    file_content = data.get("content")
    
    if not file_content:
        raise BadRequest("No content provided")
    
    try:
        if format_type == "json":
            range_data = json.loads(file_content)
            range_obj = Range.from_dict(range_data)
        elif format_type == "text":
            range_obj = Range(name="Imported Range", description="Imported from text")
            for line in file_content.split("\n"):
                line = line.strip()
                if ":" in line:
                    hand_str, action = line.split(":", 1)
                    range_obj.hands[hand_str.strip()] = action.strip()
        elif format_type == "csv":
            range_obj = Range(name="Imported Range", description="Imported from CSV")
            for line in file_content.split("\n")[1:]:  # Skip header
                line = line.strip()
                if "," in line:
                    hand_str, action = line.split(",", 1)
                    range_obj.hands[hand_str.strip()] = action.strip()
        else:
            raise BadRequest(f"Unsupported format: {format_type}")
        
        # Sauvegarder dans la base de données
        range_model = RangeModel(
            name=range_obj.name,
            description=range_obj.description,
            range_type=RangeType(range_obj.range_type.value),
            position=Position(range_obj.position.value),
            hands=range_obj.hands,
        )
        
        db.session.add(range_model)
        db.session.commit()
        
        return jsonify(range_model.to_dict()), 201
    except Exception as e:
        raise BadRequest(f"Error importing range: {str(e)}")


@range_bp.route("/default", methods=["GET"])
def get_default_ranges():
    """Récupère des ranges par défaut."""
    default_ranges = [
        {
            "name": "UTG Open Range (100bb)",
            "description": "Range d'ouverture standard depuis UTG en cash game 100bb",
            "range_type": "preflop",
            "position": "UTG",
            "hands": {
                "AA": "open",
                "KK": "open",
                "QQ": "open",
                "JJ": "open",
                "TT": "open",
                "99": "open",
                "88": "open",
                "AKs": "open",
                "AQs": "open",
                "AJs": "open",
                "ATs": "open",
                "KQs": "open",
                "AKo": "open",
                "AQo": "open",
            }
        },
        {
            "name": "BTN Open Range (100bb)",
            "description": "Range d'ouverture large depuis BTN en cash game 100bb",
            "range_type": "preflop",
            "position": "BTN",
            "hands": {
                "AA": "open",
                "KK": "open",
                "QQ": "open",
                "JJ": "open",
                "TT": "open",
                "99": "open",
                "88": "open",
                "77": "open",
                "66": "open",
                "55": "open",
                "AKs": "open",
                "AQs": "open",
                "AJs": "open",
                "ATs": "open",
                "A9s": "open",
                "A8s": "open",
                "A7s": "open",
                "A6s": "open",
                "A5s": "open",
                "A4s": "open",
                "A3s": "open",
                "A2s": "open",
                "KQs": "open",
                "KJs": "open",
                "KTs": "open",
                "QJs": "open",
                "JTs": "open",
                "T9s": "open",
                "98s": "open",
                "AKo": "open",
                "AQo": "open",
                "AJo": "open",
                "ATo": "open",
                "A9o": "open",
                "KQo": "open",
                "KJo": "open",
                "QJo": "open",
            }
        },
        {
            "name": "SB Push/Fold Range (15bb)",
            "description": "Range de push/fold depuis SB avec 15bb en tournoi",
            "range_type": "push_fold",
            "position": "SB",
            "hands": {
                "AA": "all_in",
                "KK": "all_in",
                "QQ": "all_in",
                "JJ": "all_in",
                "TT": "all_in",
                "99": "all_in",
                "88": "all_in",
                "77": "all_in",
                "66": "all_in",
                "AKs": "all_in",
                "AQs": "all_in",
                "AJs": "all_in",
                "ATs": "all_in",
                "A9s": "all_in",
                "KQs": "all_in",
                "AKo": "all_in",
                "AQo": "all_in",
            }
        },
    ]
    
    return jsonify(default_ranges)
