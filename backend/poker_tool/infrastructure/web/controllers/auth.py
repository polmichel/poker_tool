"""HTTP controllers for the users + auth resources."""
from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest, NotFound
from flask_jwt_extended import jwt_required
from ....interfaces.users import Users
from ....interfaces.auth import Auth
from ....use_cases.register_user import RegisterUser, UserAlreadyExists
from ....use_cases.login_user import LoginUser, InvalidCredentials
from ....use_cases.current_user import CurrentUser


class UserController:
    """Thin HTTP controller for /api/users."""

    def __init__(self, users: Users, auth: Auth, login_user: LoginUser) -> None:
        self._users = users
        self._auth = auth
        self._login_user = login_user

    def register(self, api: Blueprint) -> None:
        @api.route("/users", methods=["GET"])
        def get_users():
            users = self._users.all()
            return jsonify([u.to_dict() for u in users])

        @api.route("/users/<int:user_id>", methods=["GET"])
        def get_user(user_id: int):
            user = self._users.user_by_id(user_id)
            if not user:
                raise NotFound(f"User {user_id} not found")
            return jsonify(user.to_dict())

        @api.route("/users", methods=["POST"])
        def create_user():
            data = request.get_json()
            if not data or "username" not in data or "email" not in data or "password" not in data:
                raise BadRequest("Missing required fields: username, email, password")
            user = self._auth.create_user(
                username=data["username"], email=data["email"], password=data["password"],
            )
            saved_user = self._users.add(user)
            return jsonify(saved_user.to_dict()), 201

        @api.route("/users/login", methods=["POST"])
        def login():
            data = request.get_json()
            if not data or "username" not in data or "password" not in data:
                raise BadRequest("Missing username or password")
            try:
                result = self._login_user.login(data["username"], data["password"])
            except InvalidCredentials as e:
                if "not found" in str(e).lower():
                    raise NotFound("User not found")
                raise BadRequest("Invalid password")
            return jsonify({"token": result.token, "user": result.user.to_dict()})


class AuthController:
    """Thin HTTP controller for /api/auth."""

    def __init__(self, register_user: RegisterUser, login_user: LoginUser,
                 current_user: CurrentUser) -> None:
        self._register_user = register_user
        self._login_user = login_user
        self._current_user = current_user

    def register(self, api: Blueprint) -> None:
        @api.route("/auth/register", methods=["POST"])
        def auth_register():
            data = request.get_json()
            if not data or "username" not in data or "email" not in data or "password" not in data:
                raise BadRequest("Missing required fields: username, email, password")
            try:
                result = self._register_user.register(
                    data["username"], data["email"], data["password"],
                )
            except UserAlreadyExists as e:
                raise BadRequest(str(e))
            return jsonify({"access_token": result.token, "user": result.user.to_dict()}), 201

        @api.route("/auth/login", methods=["POST"])
        def auth_login():
            data = request.get_json()
            if not data or "username" not in data or "password" not in data:
                raise BadRequest("Missing username or password")
            try:
                result = self._login_user.login(data["username"], data["password"])
            except InvalidCredentials as e:
                if "not found" in str(e).lower():
                    raise NotFound("User not found")
                raise BadRequest("Invalid password")
            return jsonify({"access_token": result.token, "user": result.user.to_dict()})

        @api.route("/auth/me", methods=["GET"])
        @jwt_required()
        def auth_me():
            user = self._current_user.user()
            if not user:
                raise NotFound("User not found")
            return jsonify(user.to_dict())
