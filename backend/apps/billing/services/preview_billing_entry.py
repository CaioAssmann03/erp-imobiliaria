import uuid
from datetime import date
from decimal import Decimal
from typing import Any

from apps.billing.models import BillingEntry


def preview_billing_entry(entry_data: dict[str, Any], reference_month: date) -> dict[uuid.UUID, Decimal]:
    """What each selected unit would pay in the reference month for an entry that is not saved yet."""
    entry = BillingEntry(**{key: value for key, value in entry_data.items() if key != "units"})
    units = [unit_data["unit"] for unit_data in entry_data["units"]]
    overrides = {unit_data["unit"].pk: unit_data["amount"] for unit_data in entry_data["units"] if unit_data.get("amount")}
    if not entry.covers(reference_month):
        return {unit.pk: Decimal(0) for unit in units}
    return entry.amounts_by_unit(units, overrides)
