from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Case, DecimalField, F, Sum, When

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.finance.models.current_account_entry import (
        CurrentAccountEntry,  # noqa: F401
    )


class CurrentAccountEntryQuerySet(models.QuerySet["CurrentAccountEntry"]):
    def _signed_amount(self) -> Case:
        """Credits count `+amount`, debits `-amount` (the same rule as `CurrentAccountEntry.signed_amount`)."""
        kind = self.model.Kind
        return Case(
            When(kind=kind.CREDIT, then=F("amount")),
            When(kind=kind.DEBIT, then=-F("amount")),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )

    def signed_total(self) -> Decimal:
        """Sum of credits minus sum of debits (0 when there are no entries)."""
        total = self.aggregate(total=Sum(self._signed_amount()))["total"]
        return total or Decimal(0)

    def balances_by_cost_center(self) -> list[dict[str, object]]:
        """The balance of each cost center (the statement's *Saldo Sub-Contas*), by cost center name."""
        rows = (
            self.order_by()
            .values("cost_center", "cost_center__name")
            .annotate(balance=Sum(self._signed_amount()))
            .order_by("cost_center__name")
        )
        return [
            {"cost_center": row["cost_center"], "cost_center_name": row["cost_center__name"], "balance": row["balance"]}
            for row in rows
        ]
