from datetime import date
from decimal import Decimal

from django.db import transaction

from apps.billing.models import BillingDocument, BillingDocumentPayment, BillingDocumentRegistration, GatewayEvent
from apps.finance.models import CompanyEntry, CurrentAccount, CurrentAccountEntry, EntryBatch
from apps.finance.services.post_entries import post_entries


@transaction.atomic
def post_billing_document_payment(
    document: BillingDocument,
    registration: BillingDocumentRegistration,
    event: GatewayEvent,
    paid_amount: Decimal,
    paid_on: date,
) -> BillingDocumentPayment:
    """Record a document's payment: one credit per item in the condominium's current account, the document `paid`.

    A line that credits the administradora (the registration fee) is credited to the administradora's own ledger
    (`CompanyEntry`), never to the condominium.

    All or nothing, in one transaction; the caller has already checked that the document is `registered` and that
    `paid_amount` is the document's amount. The ledger refuses a second entry for an item, so a repeat cannot post twice.
    """
    condominium = document.unit.condominium
    current_account, _ = CurrentAccount.objects.get_or_create(
        condominium=condominium, defaults={"company_id": condominium.company_id}
    )
    batch = EntryBatch(company_id=condominium.company_id, batch_date=paid_on, origin=EntryBatch.OriginType.BANK)
    batch.full_clean()
    batch.save()
    items = document.items.select_related("cost_center", "entry_template", "document__unit").order_by("position")
    _ = post_entries(
        [CurrentAccountEntry.receiving(item, current_account, batch, paid_on) for item in items if not item.credits_company]
    )
    for item in items:
        if item.credits_company:
            company_entry = CompanyEntry.receiving(item, paid_on)
            company_entry.full_clean()
            company_entry.save()

    net_amount = event.payment.get("netValue")
    payment = BillingDocumentPayment(
        document=document,
        registration=registration,
        gateway_event=event,
        paid_on=paid_on,
        amount=paid_amount,
        net_amount=Decimal(str(net_amount)) if net_amount is not None else None,
    )
    payment.full_clean()
    payment.save()
    document.status = BillingDocument.Status.PAID
    document.full_clean()
    document.save()
    return payment
