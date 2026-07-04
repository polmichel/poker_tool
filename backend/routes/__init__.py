from flask import Blueprint

# Importer les routes pour les enregistrer
from . import ranges, training, stats

# Créer un Blueprint pour les routes de l'API
api_bp = Blueprint("api", __name__, url_prefix="/api")

# Enregistrer les routes
api_bp.register_blueprint(ranges.range_bp)
api_bp.register_blueprint(training.training_bp)
api_bp.register_blueprint(stats.stats_bp)
