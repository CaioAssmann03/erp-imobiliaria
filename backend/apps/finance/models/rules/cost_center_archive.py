from typing import TYPE_CHECKING

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import CostCenterError

if TYPE_CHECKING:
    from apps.finance.models.cost_center import CostCenter  # noqa: F401

NOT_A_FIELD = "__all__"


class CostCenterArchiveRules(ModelRules["CostCenter"]):
    @rule(NOT_A_FIELD, CostCenterError.DELETION_HAS_ENTRY_TEMPLATES)
    def has_entry_templates(self) -> bool:
        return self.instance.entry_templates.exists()

    @rule(NOT_A_FIELD, CostCenterError.ARCHIVE_IN_ACTIVE_BILLING_PLAN)
    def is_in_active_billing_plan(self) -> bool:
        return self.instance.billing_plan_items.filter(plan__active=True).exists()
