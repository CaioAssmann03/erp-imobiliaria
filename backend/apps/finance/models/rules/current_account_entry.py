from typing import TYPE_CHECKING

from apps.core.models.rules import ModelRules, rule
from apps.finance.errors import CurrentAccountEntryError

if TYPE_CHECKING:
    from apps.finance.models.current_account_entry import (
        CurrentAccountEntry,  # noqa: F401
    )


class CurrentAccountEntryRules(ModelRules["CurrentAccountEntry"]):
    """The entry, its account, batch, cost center and entry template must agree on company and condominium."""

    @rule("current_account", CurrentAccountEntryError.CURRENT_ACCOUNT_OTHER_COMPANY)
    def current_account_belongs_to_another_company(self) -> bool:
        entry = self.instance
        if entry.current_account_id is None or entry.company_id is None:
            return False
        return entry.current_account.company_id != entry.company_id

    @rule("batch", CurrentAccountEntryError.BATCH_OTHER_COMPANY)
    def batch_belongs_to_another_company(self) -> bool:
        entry = self.instance
        if entry.batch_id is None or entry.company_id is None:
            return False
        return entry.batch.company_id != entry.company_id

    @rule("cost_center", CurrentAccountEntryError.COST_CENTER_OTHER_CONDOMINIUM)
    def cost_center_belongs_to_another_condominium(self) -> bool:
        entry = self.instance
        if entry.cost_center_id is None or entry.current_account_id is None:
            return False
        return entry.cost_center.condominium_id != entry.current_account.condominium_id

    @rule("cost_center", CurrentAccountEntryError.COST_CENTER_INACTIVE)
    def cost_center_is_inactive(self) -> bool:
        entry = self.instance
        return entry.cost_center_id is not None and not entry.cost_center.active

    @rule("entry_template", CurrentAccountEntryError.ENTRY_TEMPLATE_OTHER_CONDOMINIUM)
    def entry_template_belongs_to_another_condominium(self) -> bool:
        entry = self.instance
        if entry.entry_template_id is None or entry.current_account_id is None:
            return False
        return entry.entry_template.cost_center.condominium_id != entry.current_account.condominium_id

    @rule("entry_template", CurrentAccountEntryError.ENTRY_TEMPLATE_INACTIVE)
    def entry_template_is_inactive(self) -> bool:
        entry = self.instance
        return entry.entry_template_id is not None and not entry.entry_template.active

    @rule("unit", CurrentAccountEntryError.UNIT_OTHER_CONDOMINIUM)
    def unit_belongs_to_another_condominium(self) -> bool:
        entry = self.instance
        unit = entry.unit
        if unit is None or entry.current_account_id is None:
            return False
        return unit.condominium_id != entry.current_account.condominium_id

    @rule("competence_month", CurrentAccountEntryError.COMPETENCE_MONTH_NOT_FIRST_DAY)
    def competence_month_is_not_the_first_day(self) -> bool:
        competence_month = self.instance.competence_month
        return competence_month is not None and competence_month.day != 1

    @rule("justification", CurrentAccountEntryError.JUSTIFICATION_BLANK)
    def manual_entry_lacks_justification(self) -> bool:
        entry = self.instance
        return entry.origin == entry.Origin.MANUAL and not (entry.justification or "").strip()

    @rule("account_payable", CurrentAccountEntryError.ACCOUNT_PAYABLE_MATCHES_ORIGIN)
    def account_payable_does_not_match_origin(self) -> bool:
        entry = self.instance
        is_automatic = entry.origin == entry.Origin.AUTOMATIC_PAYABLE
        return is_automatic != (entry.account_payable_id is not None)

    @rule("account_payable", CurrentAccountEntryError.ACCOUNT_PAYABLE_OTHER_CONDOMINIUM)
    def account_payable_belongs_to_another_condominium(self) -> bool:
        entry = self.instance
        account_payable = entry.account_payable
        if account_payable is None or entry.current_account_id is None:
            return False
        return account_payable.condominium_id != entry.current_account.condominium_id

    @rule("account_payable", CurrentAccountEntryError.ACCOUNT_PAYABLE_ALREADY_POSTED)
    def account_payable_already_has_an_entry(self) -> bool:
        entry = self.instance
        if entry.account_payable_id is None or not entry._state.adding:
            return False
        return type(entry).objects.filter(account_payable_id=entry.account_payable_id).exists()

    @rule("reversal_of", CurrentAccountEntryError.REVERSAL_OTHER_ACCOUNT)
    def reversal_belongs_to_another_account(self) -> bool:
        entry = self.instance
        reversal_of = entry.reversal_of
        return reversal_of is not None and reversal_of.current_account_id != entry.current_account_id

    @rule("reversal_of", CurrentAccountEntryError.REVERSAL_OF_A_REVERSAL)
    def reversal_targets_a_reversal(self) -> bool:
        reversal_of = self.instance.reversal_of
        return reversal_of is not None and reversal_of.reversal_of_id is not None

    @rule("reversal_of", CurrentAccountEntryError.REVERSAL_ALREADY_REVERSED)
    def reversal_targets_an_already_reversed_entry(self) -> bool:
        entry = self.instance
        if entry.reversal_of_id is None or not entry._state.adding:
            return False
        return type(entry).objects.filter(reversal_of_id=entry.reversal_of_id).exists()

    @rule("reversal_of", CurrentAccountEntryError.REVERSAL_SAME_KIND)
    def reversal_has_the_same_kind(self) -> bool:
        entry = self.instance
        reversal_of = entry.reversal_of
        return reversal_of is not None and reversal_of.kind == entry.kind

    @rule("reversal_of", CurrentAccountEntryError.REVERSAL_AMOUNT_DIFFERS)
    def reversal_has_another_amount(self) -> bool:
        entry = self.instance
        reversal_of = entry.reversal_of
        return reversal_of is not None and reversal_of.amount != entry.amount

    @rule("billing_document_item", CurrentAccountEntryError.BILLING_DOCUMENT_ITEM_MATCHES_ORIGIN)
    def billing_document_item_does_not_match_origin(self) -> bool:
        entry = self.instance
        is_automatic = entry.origin == entry.Origin.AUTOMATIC_BILLING
        return is_automatic != (entry.billing_document_item_id is not None)

    @rule("billing_document_item", CurrentAccountEntryError.BILLING_DOCUMENT_ITEM_OTHER_CONDOMINIUM)
    def billing_document_item_belongs_to_another_condominium(self) -> bool:
        entry = self.instance
        item = entry.billing_document_item
        if item is None or entry.current_account_id is None:
            return False
        return item.document.unit.condominium_id != entry.current_account.condominium_id

    @rule("billing_document_item", CurrentAccountEntryError.BILLING_DOCUMENT_ITEM_ALREADY_POSTED)
    def billing_document_item_already_has_an_entry(self) -> bool:
        entry = self.instance
        if entry.billing_document_item_id is None or not entry._state.adding:
            return False
        return type(entry).objects.filter(billing_document_item_id=entry.billing_document_item_id).exists()
