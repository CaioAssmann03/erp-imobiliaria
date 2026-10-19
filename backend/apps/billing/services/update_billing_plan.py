from typing import Any

from django.db import transaction

from apps.billing.models import BillingPlan
from apps.billing.services.replace_billing_plan_items import replace_billing_plan_items


@transaction.atomic
def update_billing_plan(plan: BillingPlan, plan_data: dict[str, Any]) -> BillingPlan:
    """Update a plan; when `items` is given, it replaces the whole item list."""
    plan_fields = dict(plan_data)
    items_data = plan_fields.pop("items", None)
    for field_name, field_value in plan_fields.items():
        setattr(plan, field_name, field_value)
    plan.full_clean()
    plan.save()
    if items_data is not None:
        _ = replace_billing_plan_items(plan, items_data)
    return plan
