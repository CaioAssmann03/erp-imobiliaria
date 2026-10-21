from typing import Any

from apps.core.scoping import scope_to_company
from apps.finance.models import AccountPayable

from .ranking import LIMIT_PER_TYPE, relevance_rank
from .term import ClassifiedTerm
from .text_match import name_matches


def search_accounts_payable(user: Any, query: ClassifiedTerm) -> list[AccountPayable]:
    """By description, document number or supplier name; the soonest due first among equals."""
    conditions = name_matches(query, "description", "document_number", "supplier__person__name")
    if conditions is None:
        return []
    contains, starts_with = conditions
    return list(
        scope_to_company(AccountPayable.objects.all(), user)
        .filter(contains)
        .annotate(rank=relevance_rank([starts_with], None))
        .select_related("supplier__person", "condominium")
        .order_by("rank", "-due_date")[:LIMIT_PER_TYPE]
    )
