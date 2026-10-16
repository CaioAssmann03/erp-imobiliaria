from typing import TYPE_CHECKING

from apps.condominiums.errors import BillingRulesError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.billing_rules import BillingRules  # noqa: F401


class BillingRulesRules(ModelRules["BillingRules"]):
    """Each rule is also guarded by a check constraint."""

    @rule("initial_late_fee_days", BillingRulesError.INITIAL_LATE_FEE_INCOMPLETE)
    def initial_late_fee_lacks_days(self) -> bool:
        billing_rules = self.instance
        return (
            billing_rules.initial_late_fee_percentage is not None
            and billing_rules.initial_late_fee_days is None
        )

    @rule("initial_late_fee_percentage", BillingRulesError.INITIAL_LATE_FEE_INCOMPLETE)
    def initial_late_fee_lacks_percentage(self) -> bool:
        billing_rules = self.instance
        return (
            billing_rules.initial_late_fee_days is not None
            and billing_rules.initial_late_fee_percentage is None
        )
