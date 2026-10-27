from datetime import date
from typing import Any, Protocol

from django.db import transaction

from apps.billing.errors import BillingDocumentRegistrationError, GatewayAccountError
from apps.billing.infrastructure.gateway.asaas_client import AsaasClient, GatewayError
from apps.billing.models import BillingDocument, BillingDocumentRegistration, GatewayAccount
from apps.billing.infrastructure.gateway.charges import (
    ChargeGateway,
    ensure_customer,
    fetch_boleto_details,
    find_or_create_charge,
)
from apps.billing.services.register_billing_document import record_failure, record_registration

Status = BillingDocumentRegistration.Status


class ReissueGateway(ChargeGateway, Protocol):
    def delete_payment(self, payment_id: str) -> dict[str, Any]: ...


def reissue_billing_document(
    document: BillingDocument, due_date: date, client: ReissueGateway | None = None
) -> BillingDocumentRegistration:
    """Replace a registered document's charge with a new one due on `due_date` (spec 034); never deletes a record.

    The new charge is created first, the old registration becomes `replaced`, and only then is the old charge cancelled
    at the gateway so it cannot be paid twice. If that cancellation fails the old registration keeps the code
    `old_charge_not_cancelled`, and a payment of the old charge reaches the unprocessed queue. A refusal of the new
    charge is kept as a `failed` registration and the current one stays.
    """
    if document.status != BillingDocument.Status.REGISTERED:
        raise GatewayError(BillingDocumentRegistrationError.DOCUMENT_NOT_REGISTERED)
    current = document.registrations.filter(status__in=(Status.ACTIVE, Status.CANCELLED)).order_by("-created_at").first()
    if current is None:
        raise GatewayError(BillingDocumentRegistrationError.NOTHING_TO_REISSUE)
    account = GatewayAccount.objects.filter(condominium_id=document.unit.condominium_id).first()
    if account is None or not account.can_register_charges():
        raise GatewayError(BillingDocumentRegistrationError.NO_ACTIVE_GATEWAY_ACCOUNT)
    if document.payer.tax_id is None:
        raise GatewayError(BillingDocumentRegistrationError.PAYER_WITHOUT_DOCUMENT)

    gateway = client or AsaasClient(api_key=account.api_key)
    reference = f"{document.pk}:{document.registrations.count()}"
    try:
        customer_id = ensure_customer(document.payer, account, gateway)
        payment = find_or_create_charge(document, customer_id, gateway, due_date, reference)
        details = fetch_boleto_details(payment["id"], gateway)
    except GatewayError as error:
        if error.error is not GatewayAccountError.GATEWAY_REJECTED:
            raise
        return record_failure(document, account, error.codes, BillingDocumentRegistration.Reason.REISSUE, due_date)

    was_live = current.status == Status.ACTIVE
    with transaction.atomic():
        BillingDocumentRegistration.objects.filter(pk=current.pk).update(status=Status.REPLACED)
        registration = record_registration(
            document, account, payment, details, BillingDocumentRegistration.Reason.REISSUE, due_date
        )
    if was_live:
        try:
            _ = gateway.delete_payment(current.gateway_payment_id)
        except GatewayError as error:
            BillingDocumentRegistration.objects.filter(pk=current.pk).update(
                error_codes=["old_charge_not_cancelled", *error.codes]
            )
    return registration
