from typing import TYPE_CHECKING

from apps.billing.errors import BillingPlanItemError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_plan import BillingPlan
    from apps.billing.models.billing_plan_item import BillingPlanItem  # noqa: F401


class BillingPlanItemRules(ModelRules["BillingPlanItem"]):
    """An item validated without its plan (a nested item before the plan exists) skips the plan's rule;
    `BillingPlan.collect_item_errors` runs these rules again with the plan attached."""

    @rule("amount", BillingPlanItemError.AMOUNT_DOES_NOT_MATCH_KIND)
    def amount_does_not_match_kind(self) -> bool:
        item = self.instance
        if not item.calculation_kind:
            return False
        needs_amount = item.calculation_kind != item.CalculationKind.UNIT_REGISTERED_VALUE
        return needs_amount != (item.amount is not None)

    @rule("apportionment_criterion", BillingPlanItemError.APPORTIONMENT_CRITERION_DOES_NOT_MATCH_KIND)
    def apportionment_criterion_does_not_match_kind(self) -> bool:
        item = self.instance
        if not item.calculation_kind:
            return False
        needs_criterion = item.calculation_kind == item.CalculationKind.IDEAL_FRACTION_SHARE
        return needs_criterion != (item.apportionment_criterion_id is not None)

    @rule("apportionment_criterion", BillingPlanItemError.APPORTIONMENT_CRITERION_OTHER_CONDOMINIUM)
    def apportionment_criterion_belongs_to_another_condominium(self) -> bool:
        item, plan = self.instance, self._plan()
        criterion = item.apportionment_criterion
        if plan is None or criterion is None:
            return False
        return criterion.condominium_id != plan.condominium_id

    @rule("description", BillingPlanItemError.DESCRIPTION_OR_EVENT_REQUIRED)
    def has_neither_event_nor_description(self) -> bool:
        item = self.instance
        return item.event is None and not item.description.strip()

    @rule("event", BillingPlanItemError.EVENT_OTHER_COMPANY)
    def event_belongs_to_another_company(self) -> bool:
        item, plan = self.instance, self._plan()
        if item.event is None or plan is None:
            return False
        return item.event.company_id != plan.condominium.company_id

    @rule("event", BillingPlanItemError.EVENT_CREDITS_COMPANY)
    def event_credits_the_company(self) -> bool:
        item = self.instance
        return item.event is not None and item.event.credits_company

    @rule("unit_value_field", BillingPlanItemError.UNIT_VALUE_FIELD_DOES_NOT_MATCH_KIND)
    def unit_value_field_does_not_match_kind(self) -> bool:
        item = self.instance
        if not item.calculation_kind:
            return False
        needs_unit_value_field = item.calculation_kind == item.CalculationKind.UNIT_REGISTERED_VALUE
        return needs_unit_value_field != bool(item.unit_value_field)

    @rule("cost_center", BillingPlanItemError.COST_CENTER_OTHER_CONDOMINIUM)
    def cost_center_belongs_to_another_condominium(self) -> bool:
        item, plan = self.instance, self._plan()
        if plan is None or item.cost_center_id is None:
            return False
        return item.cost_center.condominium_id != plan.condominium_id

    @rule("cost_center", BillingPlanItemError.COST_CENTER_INACTIVE)
    def cost_center_is_inactive(self) -> bool:
        item = self.instance
        return item.cost_center_id is not None and not item.cost_center.active

    @rule("entry_template", BillingPlanItemError.ENTRY_TEMPLATE_OTHER_COST_CENTER)
    def entry_template_belongs_to_another_cost_center(self) -> bool:
        item = self.instance
        if item.entry_template_id is None or item.cost_center_id is None:
            return False
        return item.entry_template.cost_center_id != item.cost_center_id

    @rule("entry_template", BillingPlanItemError.ENTRY_TEMPLATE_INACTIVE)
    def entry_template_is_inactive(self) -> bool:
        item = self.instance
        return item.entry_template_id is not None and not item.entry_template.active

    def _plan(self) -> "BillingPlan | None":
        """The plan, saved or not yet (a candidate attached by `BillingPlan.collect_item_errors`); None when unknown."""
        item = self.instance
        if item.plan_id is None and not item._meta.get_field("plan").is_cached(item):
            return None
        return item.plan
