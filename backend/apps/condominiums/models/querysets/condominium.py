from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.condominium import Condominium  # noqa: F401


class CondominiumQuerySet(models.QuerySet["Condominium"]):
    def without_cost_centers(self) -> "CondominiumQuerySet":
        """Active condominiums with no cost center (sub-conta): they block the finance."""
        return self.filter(active=True, cost_centers__isnull=True)
