import uuid
from collections.abc import Callable
from datetime import date, timedelta
from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.administration_contract import (
        AdministrationContract,  # noqa: F401
    )


ADJUSTMENT_ALERT_DAYS = 30  # days: window of the "adjustment coming up" pendency


class AdministrationContractQuerySet(models.QuerySet["AdministrationContract"]):
    def _adjustment_condominium_ids(
        self, is_wanted: Callable[[date], bool]
    ) -> list[uuid.UUID]:
        contracts = self.filter(
            condominium__active=True, adjustment_base_date__isnull=False
        )
        ids: list[uuid.UUID] = []
        for contract in contracts:
            next_date = contract.next_adjustment_date()
            if next_date is not None and is_wanted(next_date):
                ids.append(contract.condominium_id)
        return ids

    def overdue_adjustment_condominium_ids(
        self, reference_date: date
    ) -> list[uuid.UUID]:
        """Active condominiums whose next adjustment date has already passed."""
        return self._adjustment_condominium_ids(
            lambda next_date: next_date < reference_date
        )

    def upcoming_adjustment_condominium_ids(
        self, reference_date: date
    ) -> list[uuid.UUID]:
        """Active condominiums whose next adjustment falls within the next 30 days."""
        window_end = reference_date + timedelta(days=ADJUSTMENT_ALERT_DAYS)
        return self._adjustment_condominium_ids(
            lambda next_date: reference_date <= next_date <= window_end
        )
