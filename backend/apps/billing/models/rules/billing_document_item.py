from typing import TYPE_CHECKING

from apps.billing.errors import BillingDocumentItemError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_document_item import (
        BillingDocumentItem,  # noqa: F401
    )

ITEM_FIELDS = ("document_id", "position", "description", "cost_center_id", "entry_template_id", "credits_company", "amount")


class BillingDocumentItemRules(ModelRules["BillingDocumentItem"]):
    """Active cost centers and templates are checked only when the item is created: a document is a
    record of what was issued, so deactivating them later must not invalidate it."""

    @rule("cost_center", BillingDocumentItemError.COST_CENTER_OTHER_CONDOMINIUM)
    def cost_center_belongs_to_another_condominium(self) -> bool:
        item = self.instance
        cost_center = item.cost_center
        if item.document_id is None or cost_center is None:
            return False
        return cost_center.condominium_id != item.document.unit.condominium_id

    @rule("cost_center", BillingDocumentItemError.COST_CENTER_INACTIVE)
    def cost_center_is_inactive(self) -> bool:
        item = self.instance
        cost_center = item.cost_center
        return item._state.adding and cost_center is not None and not cost_center.active

    @rule("entry_template", BillingDocumentItemError.ENTRY_TEMPLATE_OTHER_COST_CENTER)
    def entry_template_belongs_to_another_cost_center(self) -> bool:
        item = self.instance
        entry_template = item.entry_template
        if entry_template is None or item.cost_center_id is None:
            return False
        return entry_template.cost_center_id != item.cost_center_id

    @rule("entry_template", BillingDocumentItemError.ENTRY_TEMPLATE_INACTIVE)
    def entry_template_is_inactive(self) -> bool:
        item = self.instance
        entry_template = item.entry_template
        return item._state.adding and entry_template is not None and not entry_template.active

    @rule("amount", BillingDocumentItemError.DATA_IMMUTABLE)
    def item_changed_after_creation(self) -> bool:
        item = self.instance
        if item._state.adding:
            return False
        stored = type(item).objects.filter(pk=item.pk).values(*ITEM_FIELDS).first()
        return stored is not None and any(stored[field] != getattr(item, field) for field in ITEM_FIELDS)
