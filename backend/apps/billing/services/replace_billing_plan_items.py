from typing import Any

from django.db import transaction

from apps.billing.models import BillingPlan, BillingPlanItem


@transaction.atomic
def replace_billing_plan_items(plan: BillingPlan, items_data: list[dict[str, Any]]) -> list[BillingPlanItem]:
    """The plan's items become exactly `items_data`, in that order (their `position`)."""
    _ = plan.items.all().delete()
    items: list[BillingPlanItem] = []
    for position, item_data in enumerate(items_data):
        item = BillingPlanItem(plan=plan, position=position, **item_data)
        item.full_clean()
        item.save()
        items.append(item)
    return items
