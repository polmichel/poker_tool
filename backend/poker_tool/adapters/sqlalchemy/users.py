"""
SQLAlchemy implementation of the :class:`Users` port (Elegant Objects).
"""
from typing import List, Optional
from flask_sqlalchemy import SQLAlchemy
from ...interfaces.users import Users
from ...objects.user import User
from .models import db, UserModel


class SqlUsers(Users):
    """SQLAlchemy implementation of the Users port."""

    def __init__(self, app=None) -> None:
        self.db = db
        if app:
            self.init_app(app)

    def init_app(self, app) -> None:
        """Initialize SQLAlchemy with a Flask app (idempotent)."""
        # The ``db`` instance is shared across all Sql* adapters; only the
        # first adapter to initialize binds it to the app.
        if not getattr(app, "_sqlalchemy_initialized", False):
            self.db.init_app(app)
            app._sqlalchemy_initialized = True
        with app.app_context():
            self.db.create_all()

    def add(self, user: User) -> User:
        """Add a new user or update an existing one; return the stored user."""
        if user.id:
            model = UserModel.query.get(user.id)
            if model:
                model.username = user.username
                model.email = user.email
                model.password_hash = user.password_hash
        else:
            model = UserModel(
                username=user.username,
                email=user.email,
                password_hash=user.password_hash,
            )
            self.db.session.add(model)
        self.db.session.commit()
        return model.to_domain()

    def user_by_id(self, user_id: int) -> Optional[User]:
        model = UserModel.query.get(user_id)
        return model.to_domain() if model else None

    def user_by_username(self, username: str) -> Optional[User]:
        model = UserModel.query.filter_by(username=username).first()
        return model.to_domain() if model else None

    def user_by_email(self, email: str) -> Optional[User]:
        model = UserModel.query.filter_by(email=email).first()
        return model.to_domain() if model else None

    def all(self) -> List[User]:
        return [model.to_domain() for model in UserModel.query.all()]
