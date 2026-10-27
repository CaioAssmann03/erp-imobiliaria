from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any

from apps.billing.models import BillingEntry
from apps.condominiums.models import Unit


@dataclass(frozen=True)
class BillingEntryPreview:
    reference_month: date
    unit_amounts: list[tuple[Unit, Decimal]]

    @property
    def total(self) -> Decimal:
        return sum((amount for _, amount in self.unit_amounts), Decimal(0))


def preview_billing_entry(
    entry_data: dict[str, Any], reference_month: date
) -> BillingEntryPreview:
    """What each selected unit would pay in the reference month for an entry that is not saved yet."""
    entry = BillingEntry(
        **{key: value for key, value in entry_data.items() if key != "units"}
    )
    units = [unit_data["unit"] for unit_data in entry_data["units"]]
    overrides = {
        unit_data["unit"].pk: unit_data["amount"]
        for unit_data in entry_data["units"]
        if unit_data.get("amount")
    }
    if not entry.covers(reference_month):
        return BillingEntryPreview(reference_month, [(unit, Decimal(0)) for unit in units])
    amounts = entry.amounts_by_unit(units, overrides)
    return BillingEntryPreview(reference_month, [(unit, amounts[unit.pk]) for unit in units])
