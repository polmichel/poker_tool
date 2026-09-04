"""HTTP controllers for the auth resources."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import BadRequest, NotFound

from ....use_cases.current_user import CurrentUser
from ....use_cases.login_user import InvalidCredentials, LoginUser
from ....use_cases.register_user import RegisterUser, UserAlreadyExists


class AuthController:
    """Thin HTTP controller for /api/auth and /api/users."""

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

        @api.route("/users", methods=["GET"])
        def get_users():
            users = self._register_user._users.all()
            return jsonify([u.to_dict() for u in users])

        @api.route("/users/<int:user_id>", methods=["GET"])
        def get_user(user_id: int):
            user = self._register_user._users.user_by_id(user_id)
            if not user:
                raise NotFound(f"User {user_id} not found")
            return jsonify(user.to_dict())

        @api.route("/users", methods=["POST"])
        def create_user():
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
