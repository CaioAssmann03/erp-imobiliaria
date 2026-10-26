from typing import Any, cast

from apps.billing.models import BillingPlan
from apps.billing.models.querysets import BillingPlanQuerySet
from apps.core.infrastructure.scoping import scope_to_company
from apps.core.infrastructure.search.ranking import LIMIT_PER_TYPE
from apps.core.infrastructure.search.term import ClassifiedTerm


def search_billing_plans(user: Any, query: ClassifiedTerm) -> list[BillingPlan]:
    plans = cast(BillingPlanQuerySet, scope_to_company(BillingPlan.objects.all(), user))
    return list(plans.search(query)[:LIMIT_PER_TYPE])
