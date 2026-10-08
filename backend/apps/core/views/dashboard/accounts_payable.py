from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Count, Sum

from apps.core.dates import add_months
from apps.finance.models.querysets import AccountPayableQuerySet

from .constants import TOP_LIST

PAYABLE_DAYS_AHEAD = 7  # dias: janela de "vencem nos próximos dias"


def payable_total(accounts: AccountPayableQuerySet) -> dict[str, object]:
    aggregate = accounts.aggregate(count=Count("pk"), total=Sum("amount"))
    return {"count": aggregate["count"], "total": aggregate["total"] or Decimal("0")}


def accounts_payable(
    reference_date: date, accounts: AccountPayableQuerySet
) -> dict[str, Any]:
    """Open accounts to pay by due window (company expenses included) and the oldest ones."""
    month_start = reference_date.replace(day=1)
    month_end = add_months(month_start, 1) - timedelta(days=1)
    upcoming = (
        accounts.open()
        .select_related("supplier__person", "condominium")
        .order_by("due_date", "created_at")[:TOP_LIST]
    )
    return {
        "overdue": payable_total(accounts.overdue(reference_date)),
        "due_today": payable_total(accounts.due_between(reference_date, reference_date)),
        "due_next_7_days": payable_total(
            accounts.due_between(
                reference_date + timedelta(days=1),
                reference_date + timedelta(days=PAYABLE_DAYS_AHEAD),
            )
        ),
        "due_this_month": payable_total(accounts.due_between(month_start, month_end)),
        "upcoming": [
            {
                "id": account.pk,
                "description": account.description,
                "supplier_name": account.supplier.person.name,
                "condominium_name": (
                    account.condominium.name if account.condominium is not None else None
                ),
                "due_date": account.due_date,
                "amount": account.amount,
                "overdue": account.due_date < reference_date,
            }
            for account in upcoming
        ],
    }
