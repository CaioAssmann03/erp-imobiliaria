from typing import TYPE_CHECKING

from apps.billing.errors import BillingPlanError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_plan import BillingPlan  # noqa: F401


class BillingPlanRules(ModelRules["BillingPlan"]):
    @rule("condominium", BillingPlanError.CONDOMINIUM_IMMUTABLE)
    def condominium_changed(self) -> bool:
        """The items' cost centers belong to the plan's condominium, so it is fixed once the plan exists."""
        plan = self.instance
        if plan._state.adding:
            return False
        stored_condominium_id = (
            type(plan).objects.filter(pk=plan.pk).values_list("condominium_id", flat=True).first()
        )
        return stored_condominium_id is not None and stored_condominium_id != plan.condominium_id

    @rule("end_month", BillingPlanError.END_MONTH_BEFORE_START_MONTH)
    def ends_before_it_starts(self) -> bool:
        plan = self.instance
        return plan.start_month is not None and plan.end_month is not None and plan.end_month < plan.start_month
