from typing import Any

from apps.billing.models import BillingPlan
from apps.core.scoping import scope_to_company

from .ranking import LIMIT_PER_TYPE, relevance_rank
from .term import ClassifiedTerm
from .text_match import name_matches


def search_billing_plans(user: Any, query: ClassifiedTerm) -> list[BillingPlan]:
    conditions = name_matches(query, "name")
    if conditions is None:
        return []
    contains, starts_with = conditions
    return list(
        scope_to_company(BillingPlan.objects.all(), user)
        .filter(contains)
        .annotate(rank=relevance_rank([starts_with], None))
        .select_related("condominium")
        .order_by("rank", "name")[:LIMIT_PER_TYPE]
    )
