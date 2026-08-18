"""SQLAlchemy adapter for Poker Tool.

Exposes a single :func:`init_sqlalchemy` helper so every ``Sql*`` port
implementation delegates the shared Flask-SQLAlchemy initialization to one
place instead of duplicating the idempotent ``init_app`` + ``create_all``
block in each adapter.
"""
from .models import db


def init_sqlalchemy(app) -> None:
    """Bind the shared ``db`` to ``app`` (once) and create the tables.

    Idempotent: the ``app._sqlalchemy_initialized`` flag guards against
    binding the same ``db`` twice when several ``Sql*`` adapters are
    constructed with the same Flask app.
    """
    if getattr(app, "_sqlalchemy_initialized", False):
        return
    db.init_app(app)
    app._sqlalchemy_initialized = True
    with app.app_context():
        db.create_all()
