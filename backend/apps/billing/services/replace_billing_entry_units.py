from typing import Any

from django.db import transaction

from apps.billing.models import BillingEntry, BillingEntryUnit


@transaction.atomic
def replace_billing_entry_units(
    entry: BillingEntry, units_data: list[dict[str, Any]]
) -> list[BillingEntryUnit]:
    """Replace the units an entry selects with the given list, all or none (a used entry is frozen)."""
    entry.assert_not_used()
    _ = entry.entry_units.all().delete()
    links = []
    for unit_data in units_data:
        link = BillingEntryUnit(
            entry=entry, unit=unit_data["unit"], amount=unit_data.get("amount")
        )
        link.full_clean()
        link.save()
        links.append(link)
    return links
