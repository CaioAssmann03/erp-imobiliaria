from typing import Any

from django.db import transaction

from apps.billing.models import BillingPlan
from apps.billing.services.replace_billing_plan_items import replace_billing_plan_items


@transaction.atomic
def create_billing_plan(plan_data: dict[str, Any]) -> BillingPlan:
    """Create a plan with its items, all or none."""
    plan_fields = dict(plan_data)
    items_data = plan_fields.pop("items")
    plan = BillingPlan(**plan_fields)
    plan.full_clean()
    plan.save()
    _ = replace_billing_plan_items(plan, items_data)
    return plan
