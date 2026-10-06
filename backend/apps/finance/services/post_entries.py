from django.db import transaction

from apps.finance.models import CurrentAccount, CurrentAccountEntry
from apps.finance.services.post_entry import post_entry


@transaction.atomic
def post_entries(entries: list[CurrentAccountEntry]) -> list[CurrentAccountEntry]:
    """Post several entries of a batch all together: if one is refused none is saved.

    The accounts are locked first, in a fixed order, so two simultaneous batches cannot deadlock.
    """
    account_ids = {entry.current_account_id for entry in entries}
    _ = list(CurrentAccount.objects.select_for_update().filter(pk__in=account_ids).order_by("pk"))
    return [post_entry(entry) for entry in entries]
