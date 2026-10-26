from datetime import date
from typing import TYPE_CHECKING

from apps.billing.errors import BillingEntryError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_entry import BillingEntry  # noqa: F401

USED_ENTRY_EDITABLE_FIELDS = ("end_month",)
FROZEN_FIELDS = (
    "condominium_id",
    "event_id",
    "description",
    "allocation",
    "ideal_fraction_number",
    "recurrence",
    "installments_total",
    "start_month",
    "cost_center_id",
    "amount",
)


class BillingEntryRules(ModelRules["BillingEntry"]):
    @rule("ideal_fraction_number", BillingEntryError.IDEAL_FRACTION_NUMBER_DOES_NOT_MATCH_ALLOCATION)
    def ideal_fraction_number_does_not_match_allocation(self) -> bool:
        entry = self.instance
        if not entry.allocation:
            return False
        return (entry.allocation == entry.Allocation.FRACTION) != (entry.ideal_fraction_number is not None)

    @rule("installments_total", BillingEntryError.INSTALLMENTS_TOTAL_DOES_NOT_MATCH_RECURRENCE)
    def installments_total_does_not_match_recurrence(self) -> bool:
        entry = self.instance
        if not entry.recurrence:
            return False
        if entry.recurrence == entry.Recurrence.INSTALLMENTS:
            return entry.installments_total is None or entry.installments_total < 2  # noqa: PLR2004
        return entry.installments_total is not None

    @rule("end_month", BillingEntryError.END_MONTH_ONLY_FOR_ALWAYS)
    def end_month_on_an_entry_that_does_not_repeat_always(self) -> bool:
        entry = self.instance
        return entry.end_month is not None and entry.recurrence != entry.Recurrence.ALWAYS

    @rule("end_month", BillingEntryError.END_MONTH_BEFORE_START_MONTH)
    def ends_before_it_starts(self) -> bool:
        entry = self.instance
        start: date | None = entry.start_month
        return entry.end_month is not None and start is not None and entry.end_month < start

    @rule("event", BillingEntryError.EVENT_OTHER_COMPANY)
    def event_belongs_to_another_company(self) -> bool:
        entry = self.instance
        if entry.event is None or entry.condominium_id is None:
            return False
        return entry.event.company_id != entry.condominium.company_id

    @rule("event", BillingEntryError.EVENT_INACTIVE)
    def event_is_inactive(self) -> bool:
        entry = self.instance
        return entry.event is not None and not entry.event.active and self._event_changed()

    @rule("cost_center", BillingEntryError.COST_CENTER_OTHER_CONDOMINIUM)
    def cost_center_belongs_to_another_condominium(self) -> bool:
        entry = self.instance
        if entry.cost_center_id is None or entry.condominium_id is None:
            return False
        return entry.cost_center.condominium_id != entry.condominium_id

    @rule("cost_center", BillingEntryError.COST_CENTER_INACTIVE)
    def cost_center_is_inactive(self) -> bool:
        entry = self.instance
        return entry.cost_center_id is not None and not entry.cost_center.active and self._cost_center_changed()

    @rule("cost_center", BillingEntryError.COST_CENTER_WITHOUT_ONE_ENTRY_TEMPLATE)
    def cost_center_has_not_exactly_one_active_entry_template(self) -> bool:
        """Also the place where the template is chosen: the only active template of the cost center."""
        entry = self.instance
        if entry.cost_center_id is None or not self._cost_center_changed():
            return False
        templates = list(entry.cost_center.entry_templates.filter(active=True)[:2])
        if len(templates) != 1:
            return True
        entry.entry_template = templates[0]
        return False

    @rule("amount", BillingEntryError.ALREADY_USED)
    def changes_an_entry_that_was_already_used(self) -> bool:
        entry = self.instance
        if entry._state.adding or not entry.is_used():
            return False
        stored = type(entry).objects.get(pk=entry.pk)
        return any(getattr(stored, field) != getattr(entry, field) for field in FROZEN_FIELDS)

    def _stored(self) -> "BillingEntry | None":
        entry = self.instance
        return None if entry._state.adding else type(entry).objects.filter(pk=entry.pk).first()

    def _cost_center_changed(self) -> bool:
        stored = self._stored()
        return stored is None or stored.cost_center_id != self.instance.cost_center_id

    def _event_changed(self) -> bool:
        stored = self._stored()
        return stored is None or stored.event_id != self.instance.event_id
