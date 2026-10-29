from typing import TYPE_CHECKING

from apps.billing.errors import BillingEntryError
from apps.condominiums.models import UnitApportionmentFraction
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_entry import BillingEntry
    from apps.billing.models.billing_entry_unit import BillingEntryUnit  # noqa: F401


class BillingEntryUnitRules(ModelRules["BillingEntryUnit"]):
    """A unit validated before its entry is saved skips these rules; `BillingEntry.collect_unit_errors` runs them
    again with the entry attached."""

    @rule("unit", BillingEntryError.UNIT_OTHER_CONDOMINIUM)
    def unit_belongs_to_another_condominium(self) -> bool:
        link, entry = self.instance, self._entry()
        if link.unit_id is None or entry is None:
            return False
        return link.unit.condominium_id != entry.condominium_id

    @rule("amount", BillingEntryError.UNIT_AMOUNT_ONLY_FOR_INDIVIDUAL)
    def amount_on_an_entry_that_is_not_individual(self) -> bool:
        link, entry = self.instance, self._entry()
        if link.amount is None or entry is None:
            return False
        return entry.allocation != entry.Allocation.INDIVIDUAL

    @rule("amount", BillingEntryError.UNIT_AMOUNT_SIGN_DIFFERS)
    def amount_has_another_sign_than_the_entry(self) -> bool:
        link, entry = self.instance, self._entry()
        if link.amount is None or entry is None or entry.amount is None:
            return False
        return (link.amount < 0) != (entry.amount < 0)

    @rule("unit", BillingEntryError.UNIT_WITHOUT_FRACTION)
    def unit_has_no_fraction_in_the_entry_criterion(self) -> bool:
        link, entry = self.instance, self._entry()
        if (
            link.unit_id is None
            or entry is None
            or entry.allocation != entry.Allocation.FRACTION
            or entry.apportionment_criterion_id is None
        ):
            return False
        return not UnitApportionmentFraction.objects.filter(
            unit_id=link.unit_id, criterion_id=entry.apportionment_criterion_id
        ).exists()

    def _entry(self) -> "BillingEntry | None":
        """The entry, saved or not yet (a candidate attached by `BillingEntry.collect_unit_errors`); None when unknown."""
        link = self.instance
        if link.entry_id is None and not link._meta.get_field("entry").is_cached(link):
            return None
        return link.entry
