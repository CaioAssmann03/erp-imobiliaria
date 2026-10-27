from typing import TYPE_CHECKING

from apps.billing.errors import CondominiumBillingRulesError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.condominium_billing_rules import CondominiumBillingRules  # noqa: F401


class CondominiumBillingRulesRules(ModelRules["CondominiumBillingRules"]):
    """The first-days late fee rules are also guarded by a check constraint."""

    @rule("condominium", CondominiumBillingRulesError.CONDOMINIUM_IMMUTABLE)
    def condominium_changed(self) -> bool:
        billing_rules = self.instance
        if billing_rules._state.adding:
            return False
        stored_condominium_id = (
            type(billing_rules).objects.filter(pk=billing_rules.pk).values_list("condominium_id", flat=True).first()
        )
        return stored_condominium_id is not None and stored_condominium_id != billing_rules.condominium_id

    @rule("initial_late_fee_days", CondominiumBillingRulesError.INITIAL_LATE_FEE_INCOMPLETE)
    def initial_late_fee_lacks_days(self) -> bool:
        billing_rules = self.instance
        return billing_rules.initial_late_fee_percentage is not None and billing_rules.initial_late_fee_days is None

    @rule("initial_late_fee_percentage", CondominiumBillingRulesError.INITIAL_LATE_FEE_INCOMPLETE)
    def initial_late_fee_lacks_percentage(self) -> bool:
        billing_rules = self.instance
        return billing_rules.initial_late_fee_days is not None and billing_rules.initial_late_fee_percentage is None
