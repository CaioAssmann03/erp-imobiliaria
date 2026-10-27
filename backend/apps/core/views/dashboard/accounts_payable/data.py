from datetime import date
from typing import Any

from apps.finance.models.querysets import AccountPayableQuerySet

UPCOMING_PAYABLES_LIMIT = 6


def accounts_payable(
    reference_date: date, accounts: AccountPayableQuerySet
) -> dict[str, Any]:
    """Open accounts to pay by due window (company expenses included) and the oldest ones."""
    upcoming = accounts.open_by_due_date().with_supplier_and_condominium()[
        :UPCOMING_PAYABLES_LIMIT
    ]
    return {
        "overdue": accounts.overdue(reference_date).totals(),
        "due_today": accounts.due_today(reference_date).totals(),
        "due_next_7_days": accounts.due_next_7_days(reference_date).totals(),
        "due_this_month": accounts.due_this_month(reference_date).totals(),
        "upcoming": [
            {
                "id": account.pk,
                "description": account.description,
                "supplier_name": account.supplier.person.name,
                "condominium_name": (
                    account.condominium.name
                    if account.condominium is not None
                    else None
                ),
                "due_date": account.due_date,
                "amount": account.amount,
                "overdue": account.due_date < reference_date,
            }
            for account in upcoming
        ],
    }
