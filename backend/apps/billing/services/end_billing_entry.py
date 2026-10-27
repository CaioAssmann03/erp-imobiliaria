from datetime import date

from django.db import transaction

from apps.billing.models import BillingEntry


@transaction.atomic
def end_billing_entry(entry: BillingEntry, end_month: date) -> BillingEntry:
    """Stop an entry that repeats always after `end_month` (allowed even when documents were issued from it)."""
    locked = BillingEntry.objects.select_for_update().get(pk=entry.pk)
    locked.end_month = end_month
    locked.full_clean()
    locked.save()
    return locked
