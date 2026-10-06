import datetime

from apps.accounts.models import User
from apps.finance.models import CurrentAccountEntry
from apps.finance.services.post_entry import post_entry


def reverse_entry(
    entry: CurrentAccountEntry, reason: str, reversal_date: datetime.date, reversed_by: User
) -> CurrentAccountEntry:
    """Cancel an entry with the opposite entry (an entry is never changed or deleted)."""
    reversal = CurrentAccountEntry.reversing(entry, reason, reversal_date)
    reversal.created_by = reversed_by
    return post_entry(reversal)
