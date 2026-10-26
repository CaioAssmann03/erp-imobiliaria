"""Billing documents API: read, filters, cancel, scoping, admin and audit (spec 025, R6)."""

from datetime import date, timedelta

import pytest
from auditlog.models import LogEntry
from django.contrib import admin
from django.test import RequestFactory
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.condominiums.models import Condominium, Unit
from apps.core.models import Company
from apps.finance.tests.base import body, error_codes, results

from ..models import BillingDocument, BillingDocumentItem
from ..services.create_billing_document import create_billing_document

pytestmark = pytest.mark.django_db

LIST = "billing-document-list"
DETAIL = "billing-document-detail"
CANCEL = "billing-document-cancel"


def test_retrieve_carries_the_items_and_the_names(api_client: APIClient, document: BillingDocument) -> None:
    response = api_client.get(reverse(DETAIL, args=[document.pk]))

    assert response.status_code == status.HTTP_200_OK
    data = body(response)
    assert data["unit_name"] == "101"
    assert data["payer_name"] == "Maria Souza"
    assert data["condominium_name"] == "Residencial Sol"
    assert data["amount"] == "450.00"
    assert [item["description"] for item in data["items"]] == ["Taxa condominial", "Fundo de reserva"]
    assert data["items"][0]["cost_center_name"] == "Taxa Ordinária"


def test_documents_cannot_be_written_through_the_api(api_client: APIClient, document: BillingDocument) -> None:
    created = api_client.post(reverse(LIST), {}, format="json")
    updated = api_client.patch(reverse(DETAIL, args=[document.pk]), {"amount": "1.00"}, format="json")
    deleted = api_client.delete(reverse(DETAIL, args=[document.pk]))

    assert created.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert updated.status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert deleted.status_code == status.HTTP_405_METHOD_NOT_ALLOWED


def test_filters_and_search(  # type: ignore[no-untyped-def]
    api_client: APIClient, document: BillingDocument, new_document, other_condominium: Condominium
) -> None:
    other_unit = Unit.objects.create(condominium=document.unit.condominium, name="202")
    _ = create_billing_document(new_document(unit=other_unit, reference_month=date(2026, 11, 1), due_date=date(2026, 11, 10)))
    _ = BillingDocument.objects.filter(pk=document.pk).update(status=BillingDocument.Status.REGISTERED)

    by_condominium = results(api_client.get(reverse(LIST), {"condominium": str(document.unit.condominium_id)}))
    by_other_condominium = results(api_client.get(reverse(LIST), {"condominium": str(other_condominium.pk)}))
    by_status = results(api_client.get(reverse(LIST), {"status": "registered"}))
    by_month = results(api_client.get(reverse(LIST), {"reference_month": "2026-11-01"}))
    by_unit_name = results(api_client.get(reverse(LIST), {"query": "202"}))

    assert len(by_condominium) == 2
    assert by_other_condominium == []
    assert [item["id"] for item in by_status] == [str(document.pk)]
    assert [item["unit_name"] for item in by_month] == ["202"]
    assert [item["unit_name"] for item in by_unit_name] == ["202"]


def test_is_overdue_follows_the_due_date(api_client: APIClient, document: BillingDocument) -> None:
    today = timezone.localdate()

    def overdue_flags() -> tuple[list[str], list[str], bool]:
        overdue = results(api_client.get(reverse(LIST), {"is_overdue": "true"}))
        not_overdue = results(api_client.get(reverse(LIST), {"is_overdue": "false"}))
        detail = body(api_client.get(reverse(DETAIL, args=[document.pk])))
        return [item["id"] for item in overdue], [item["id"] for item in not_overdue], detail["is_overdue"]

    _ = BillingDocument.objects.filter(pk=document.pk).update(due_date=today)
    assert overdue_flags() == ([], [str(document.pk)], False)

    _ = BillingDocument.objects.filter(pk=document.pk).update(due_date=today - timedelta(days=1))
    assert overdue_flags() == ([str(document.pk)], [], True)


def test_cancel_moves_the_status_and_frees_the_month(api_client: APIClient, document: BillingDocument) -> None:
    response = api_client.post(reverse(CANCEL, args=[document.pk]))

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["status"] == "cancelled"


def test_cancel_refuses_a_paid_document(api_client: APIClient, document: BillingDocument) -> None:
    _ = BillingDocument.objects.filter(pk=document.pk).update(status=BillingDocument.Status.PAID)

    response = api_client.post(reverse(CANCEL, args=[document.pk]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "status") == ["billing_document.status.transition_not_allowed"]


def test_other_company_cannot_see_or_cancel_a_document(other_api_client: APIClient, document: BillingDocument) -> None:
    listed = results(other_api_client.get(reverse(LIST)))
    hidden = other_api_client.get(reverse(DETAIL, args=[document.pk]))
    cancelled = other_api_client.post(reverse(CANCEL, args=[document.pk]))

    assert listed == []
    assert hidden.status_code == status.HTTP_404_NOT_FOUND
    assert cancelled.status_code == status.HTTP_404_NOT_FOUND


def test_admin_is_company_scoped_and_read_only(company: Company, document: BillingDocument) -> None:
    staff = User.objects.create_user("staff", password="x", company=company, is_staff=True)
    request = RequestFactory().get("/admin/")
    request.user = staff
    model_admin = admin.site._registry[BillingDocument]

    assert list(model_admin.get_queryset(request)) == [document]
    assert not model_admin.has_add_permission(request)
    assert not model_admin.has_change_permission(request, document)
    assert not model_admin.has_delete_permission(request, document)


def test_documents_and_items_are_audited(document: BillingDocument) -> None:
    assert LogEntry.objects.get_for_model(BillingDocument).count() == 1
    assert LogEntry.objects.get_for_model(BillingDocumentItem).count() == 2


def test_documents_show_the_active_registration(api_client: APIClient, document: BillingDocument) -> None:
    from ..models import BillingDocumentRegistration, GatewayAccount

    assert body(api_client.get(reverse(DETAIL, args=[document.pk])))["registration"] is None

    account = GatewayAccount.objects.create(
        company=document.unit.condominium.company,
        api_key="secret-key",
        webhook_token="secret-token",
    )
    _ = BillingDocumentRegistration.objects.create(
        document=document,
        gateway_account=account,
        registered_due_date=document.due_date,
        gateway_payment_id="pay_1",
        digitable_line="0001.2 3456",
        boleto_url="https://asaas.test/boleto/1",
        pix_payload="00020126pix",
    )

    response = api_client.get(reverse(DETAIL, args=[document.pk]))
    listed = results(api_client.get(reverse(LIST)))[0]

    registration = body(response)["registration"]
    assert (registration["digitable_line"], registration["pix_payload"]) == ("0001.2 3456", "00020126pix")
    assert listed["registration"]["boleto_url"] == "https://asaas.test/boleto/1"
    assert "pay_1" not in response.content.decode() and "secret" not in response.content.decode()
