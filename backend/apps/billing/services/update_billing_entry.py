from typing import Any

from django.db import transaction

from apps.billing.models import BillingEntry
from apps.billing.services.replace_billing_entry_units import replace_billing_entry_units


@transaction.atomic
def update_billing_entry(entry: BillingEntry, entry_data: dict[str, Any]) -> BillingEntry:
    """Change an entry that no document was issued from; sending `units` replaces the selection."""
    entry_fields = dict(entry_data)
    units_data = entry_fields.pop("units", None)
    for field, value in entry_fields.items():
        setattr(entry, field, value)
    entry.full_clean()
    entry.save()
    if units_data is not None:
        _ = replace_billing_entry_units(entry, units_data)
    return entry
