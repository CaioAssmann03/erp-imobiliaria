import uuid
from collections.abc import Callable
from datetime import date, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models

if TYPE_CHECKING:
    from apps.condominiums.models.administration_contract import (
        AdministrationContract,  # noqa: F401
    )


ADJUSTMENT_ALERT_DAYS = 30


class AdministrationContractQuerySet(models.QuerySet["AdministrationContract"]):
    def of_active_condominiums(self) -> "AdministrationContractQuerySet":
        return self.filter(condominium__active=True)

    def with_scheduled_adjustment(self) -> "AdministrationContractQuerySet":
        """Contracts with an adjustment base date, so a next adjustment date can be computed."""
        return self.filter(adjustment_base_date__isnull=False)

    def with_fixed_fee(self) -> "AdministrationContractQuerySet":
        return self.filter(fee_type=self.model.FeeType.FIXED)

    def with_variable_fee(self) -> "AdministrationContractQuerySet":
        return self.filter(fee_type=self.model.FeeType.VARIABLE)

    def fixed_fee_total(self) -> Decimal:
        """Sum of the fixed fees (zero when there are none); variable fees are not counted."""
        total = self.with_fixed_fee().aggregate(total=models.Sum("fee_amount"))["total"]
        return total or Decimal(0)

    def largest_fixed_fees(self) -> "AdministrationContractQuerySet":
        """Fixed fees above zero, the largest first, with the condominium loaded."""
        return (
            self.with_fixed_fee()
            .filter(fee_amount__gt=0)
            .select_related("condominium")
            .order_by("-fee_amount")
        )

    def _adjustment_condominium_ids(
        self, is_wanted: Callable[[date], bool]
    ) -> list[uuid.UUID]:
        contracts = self.of_active_condominiums().with_scheduled_adjustment()
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
