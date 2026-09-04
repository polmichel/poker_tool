"""HTTP controllers for the ranges resource."""
from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest, NotFound

from ....use_cases.create_range import CreateRange
from ....use_cases.delete_range import DeleteRange
from ....use_cases.errors import RangeNotFound
from ....use_cases.get_all_ranges import GetAllRanges
from ....use_cases.get_range_by_id import GetRangeById
from ....use_cases.get_ranges_by_user import GetRangesByUser
from ....use_cases.update_range import UpdateRange


class RangeController:
    """Thin HTTP controller for /api/ranges."""

    def __init__(self, ranges, auth,
                 create_range: CreateRange,
                 update_range: UpdateRange,
                 get_all_ranges: GetAllRanges,
                 get_range_by_id: GetRangeById,
                 get_ranges_by_user: GetRangesByUser,
                 delete_range: DeleteRange) -> None:
        self._create_range = create_range
        self._update_range = update_range
        self._get_all_ranges = get_all_ranges
        self._get_range_by_id = get_range_by_id
        self._get_ranges_by_user = get_ranges_by_user
        self._delete_range = delete_range

    def register(self, api: Blueprint) -> None:
        @api.route("/ranges", methods=["GET"])
        def get_ranges():
            ranges = self._get_all_ranges.get()
            return jsonify([r.to_dict() for r in ranges])

        @api.route("/ranges/<int:range_id>", methods=["GET"])
        def get_range(range_id: int):
            try:
                range_obj = self._get_range_by_id.get(range_id)
            except RangeNotFound:
                raise NotFound(f"Range {range_id} not found")
            return jsonify(range_obj.to_dict())

        @api.route("/ranges", methods=["POST"])
        def create_range():
            data = request.get_json()
            if not data or "name" not in data:
                raise BadRequest("Missing name")
            saved_range = self._create_range.create(data)
            return jsonify(saved_range.to_dict()), 201

        @api.route("/ranges/<int:range_id>", methods=["PUT"])
        def update_range(range_id: int):
            data = request.get_json()
            if not data:
                raise BadRequest("Missing data")
            try:
                saved_range = self._update_range.update(range_id, data)
            except RangeNotFound:
                raise NotFound(f"Range {range_id} not found")
            return jsonify(saved_range.to_dict())

        @api.route("/ranges/<int:range_id>", methods=["DELETE"])
        def delete_range(range_id: int):
            try:
                range_obj = self._get_range_by_id.get(range_id)
            except RangeNotFound:
                raise NotFound(f"Range {range_id} not found")
            self._delete_range.delete(range_obj)
            return jsonify({"message": f"Range {range_id} deleted"}), 200

        @api.route("/ranges/user/<int:user_id>", methods=["GET"])
        def get_user_ranges(user_id: int):
            ranges = self._get_ranges_by_user.get(user_id)
            return jsonify([r.to_dict() for r in ranges])

        @api.route("/ranges/<int:range_id>/grid", methods=["GET"])
        def get_range_grid(range_id: int):
            try:
                range_obj = self._get_range_by_id.get(range_id)
            except RangeNotFound:
                raise NotFound(f"Range {range_id} not found")
            return jsonify({"grid": range_obj.grid()})

        @api.route("/ranges/<int:range_id>/stats", methods=["GET"])
        def get_range_stats(range_id: int):
            try:
                range_obj = self._get_range_by_id.get(range_id)
            except RangeNotFound:
                raise NotFound(f"Range {range_id} not found")
            return jsonify(range_obj.statistics())
