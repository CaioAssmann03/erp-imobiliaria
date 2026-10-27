from typing import Any, cast

from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm
from apps.finance.models import CostCenter
from apps.finance.models.querysets import CostCenterQuerySet


def search_cost_centers(user: Any, query: ClassifiedTerm) -> list[CostCenter]:
    cost_centers = cast(CostCenterQuerySet, scope_to_company(CostCenter.objects.all(), user))
    return list(cost_centers.search(query)[:LIMIT_PER_TYPE])
