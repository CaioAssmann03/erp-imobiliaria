from typing import TypeVar

from django.db import models
from django.db.models import Count, Q

_Model = TypeVar("_Model", bound=models.Model)


class CountsByTypeQuerySet(models.QuerySet[_Model]):
    """Counting for the models that have `active` and `type` fields (condominiums, units)."""

    def totals(self) -> dict[str, int]:
        """How many records there are (`total`) and how many of them are active (`active`)."""
        return self.aggregate(total=Count("pk"), active=Count("pk", filter=Q(active=True)))

    def count_by_type(self) -> dict[str, int]:
        """How many records there are of each `type` that appears (a type with none is missing)."""
        return dict(self.order_by().values_list("type").annotate(total=Count("pk")))
