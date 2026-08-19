"""SQLAlchemy implementation of the :class:`Ranges` port (Elegant Objects)."""

from ...interfaces.ranges import Ranges
from ...objects.range import Range
from . import init_sqlalchemy
from .models import RangeModel, db


class SqlRanges(Ranges):
    """SQLAlchemy implementation of the Ranges port."""

    def __init__(self, app=None) -> None:
        self.db = db
        if app:
            init_sqlalchemy(app)

    def add(self, range_obj: Range) -> Range:
        """Add a new range or update an existing one; return the stored range."""
        hands_dict = {k: str(v) for k, v in range_obj.hands.items()}
        if range_obj.id:
            model = RangeModel.query.get(range_obj.id)
            if model:
                model.name = range_obj.name
                model.description = range_obj.description
                model.range_type = range_obj.type.name.lower()
                model.position = range_obj.position.name
                model.effective_stack_bb = range_obj.effective_stack_bb
                model.hands = hands_dict
                model.user_id = range_obj.user_id
        else:
            model = RangeModel(
                name=range_obj.name,
                description=range_obj.description,
                range_type=range_obj.type.name.lower(),
                position=range_obj.position.name,
                effective_stack_bb=range_obj.effective_stack_bb,
                hands=hands_dict,
                user_id=range_obj.user_id,
            )
            self.db.session.add(model)
        self.db.session.commit()
        return model.to_domain()

    def range_by_id(self, range_id: int) -> Range | None:
        model = RangeModel.query.get(range_id)
        return model.to_domain() if model else None

    def all(self) -> list[Range]:
        return [model.to_domain() for model in RangeModel.query.all()]

    def remove(self, range_obj: Range) -> None:
        if range_obj.id:
            model = RangeModel.query.get(range_obj.id)
            if model:
                self.db.session.delete(model)
                self.db.session.commit()

    def ranges_by_user(self, user_id: int) -> list[Range]:
        return [
            model.to_domain()
            for model in RangeModel.query.filter_by(user_id=user_id).all()
        ]
