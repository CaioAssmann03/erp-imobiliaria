from typing import Any

from django.db import transaction

from apps.billing.models import BillingEntry
from apps.billing.services.replace_billing_entry_units import replace_billing_entry_units


@transaction.atomic
def create_billing_entry(entry_data: dict[str, Any]) -> BillingEntry:
    """Create an entry with the units it selects, all or none; the entry template is chosen from the cost center."""
    entry_fields = dict(entry_data)
    units_data = entry_fields.pop("units")
    entry = BillingEntry(**entry_fields)
    entry.full_clean()
    entry.save()
    _ = replace_billing_entry_units(entry, units_data)
    return entry
