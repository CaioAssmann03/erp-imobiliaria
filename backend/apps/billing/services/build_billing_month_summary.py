from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import final

from django.db.models import Count, Q, QuerySet, Sum

from apps.billing.models import BillingDocument

ZERO = Decimal("0.00")


@final
@dataclass(frozen=True)
class BillingMonthSummary:
    reference_month: date
    paid_count: int
    paid_total: Decimal
    open_count: int
    open_total: Decimal

    @property
    def issued_count(self) -> int:
        return self.paid_count + self.open_count

    @property
    def issued_total(self) -> Decimal:
        return self.paid_total + self.open_total


def _months_ending_at(today: date, months: int) -> list[date]:
    """The first day of each of the last `months` months, oldest first, the last one being `today`'s month."""
    index = today.year * 12 + today.month - 1
    return [date((position // 12), (position % 12) + 1, 1) for position in range(index - months + 1, index + 1)]


def build_billing_month_summary(documents: QuerySet[BillingDocument], months: int, today: date) -> list[BillingMonthSummary]:
    """Issued, paid and open boletos (count and amount) per reference month over the last `months` months.

    `documents` is already limited to what the user may see. Cancelled boletos are left out; open is
    issued or registered, so issued is paid plus open. A month with no boleto comes with zeros.
    """
    first_months = _months_ending_at(today, months)
    paid = Q(status=BillingDocument.Status.PAID)
    awaiting = Q(status__in=BillingDocument.AWAITING_PAYMENT_STATUSES)
    lines = {
        line["reference_month"]: line
        for line in documents.prefetch_related(None)
        .filter(reference_month__gte=first_months[0], reference_month__lte=first_months[-1])
        .order_by()
        .values("reference_month")
        .annotate(
            paid_count=Count("id", filter=paid),
            paid_total=Sum("amount", filter=paid),
            open_count=Count("id", filter=awaiting),
            open_total=Sum("amount", filter=awaiting),
        )
    }
    empty = {"paid_count": 0, "paid_total": None, "open_count": 0, "open_total": None}
    summaries = []
    for month in first_months:
        line = lines.get(month, empty)
        summaries.append(
            BillingMonthSummary(
                reference_month=month,
                paid_count=line["paid_count"],
                paid_total=line["paid_total"] or ZERO,
                open_count=line["open_count"],
                open_total=line["open_total"] or ZERO,
            )
        )
    return summaries
