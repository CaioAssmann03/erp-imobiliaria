from decimal import Decimal
from typing import TYPE_CHECKING

from django.db.models import Sum
from django.utils import timezone

from apps.billing.errors import BillingDocumentError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.billing.models.billing_document import BillingDocument  # noqa: F401

# Fields frozen at issuance; the status is the only thing that moves afterwards.
ISSUED_FIELDS = (
    "unit_id",
    "payer_id",
    "kind",
    "reference_month",
    "competence_month",
    "due_date",
    "amount",
    "discount_percentage",
    "discount_days",
    "late_fee_percentage",
    "initial_late_fee_percentage",
    "initial_late_fee_days",
    "interest_calculation",
    "interest_grace_days",
    "monthly_interest_percentage",
)


class BillingDocumentRules(ModelRules["BillingDocument"]):
    @rule("payer", BillingDocumentError.PAYER_OTHER_COMPANY)
    def payer_belongs_to_another_company(self) -> bool:
        document = self.instance
        if document.unit_id is None or document.payer_id is None:
            return False
        return document.payer.company_id != document.unit.condominium.company_id

    @rule("due_date", BillingDocumentError.EXTRA_DUE_DATE_IN_THE_PAST)
    def extra_is_due_in_the_past(self) -> bool:
        document = self.instance
        return (
            document._state.adding
            and document.kind == document.Kind.EXTRA
            and document.due_date < timezone.localdate()
        )

    @rule("amount", BillingDocumentError.DATA_IMMUTABLE)
    def issued_data_changed(self) -> bool:
        document = self.instance
        if document._state.adding:
            return False
        stored = type(document).objects.filter(pk=document.pk).values(*ISSUED_FIELDS).first()
        return stored is not None and any(stored[field] != getattr(document, field) for field in ISSUED_FIELDS)

    @rule("status", BillingDocumentError.STATUS_TRANSITION_NOT_ALLOWED)
    def status_transition_is_not_allowed(self) -> bool:
        document = self.instance
        if document._state.adding:
            return False
        stored_status = type(document).objects.filter(pk=document.pk).values_list("status", flat=True).first()
        if stored_status is None or stored_status == document.status:
            return False
        return document.status not in document.ALLOWED_NEXT_STATUSES[stored_status]

    @rule("amount", BillingDocumentError.ITEMS_REQUIRED)
    def has_no_items(self) -> bool:
        document = self.instance
        return not document._state.adding and not document.items.exists()

    @rule("amount", BillingDocumentError.AMOUNT_DIFFERS_FROM_ITEMS_TOTAL)
    def amount_differs_from_items_total(self) -> bool:
        document = self.instance
        if document._state.adding:
            return False
        items_total = document.items.aggregate(total=Sum("amount"))["total"] or Decimal(0)
        return items_total != document.amount
