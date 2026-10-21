from typing import Any

from apps.billing.models import BillingDocument
from apps.core.scoping import scope_to_company

from .ranking import LIMIT_PER_TYPE, relevance_rank
from .term import ClassifiedTerm
from .text_match import name_matches


def search_billing_documents(user: Any, query: ClassifiedTerm) -> list[BillingDocument]:
    """By the payer's name or the unit's number; the latest month first among equals."""
    conditions = name_matches(query, "payer__name", "unit__name")
    if conditions is None:
        return []
    contains, starts_with = conditions
    return list(
        scope_to_company(BillingDocument.objects.all(), user)
        .filter(contains)
        .annotate(rank=relevance_rank([starts_with], None))
        .select_related("unit__condominium", "payer")
        .order_by("rank", "-reference_month")[:LIMIT_PER_TYPE]
    )
