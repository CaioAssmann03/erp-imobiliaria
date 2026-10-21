"""The `pdf` endpoint of billing documents (spec 027, R5, R7)."""

import pytest
from auditlog.models import LogEntry
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.storage import object_storage
from apps.finance.tests.base import body, errors
from apps.finance.tests.fake_storage import FakeObjectStorage

from ..models import BillingDocument, BillingDocumentPdf

pytestmark = pytest.mark.django_db

PDF = "billing-document-pdf"


@pytest.fixture
def storage(monkeypatch: pytest.MonkeyPatch) -> FakeObjectStorage:
    fake = FakeObjectStorage()
    monkeypatch.setattr(object_storage, "get_object_storage", lambda: fake)
    return fake


def test_get_before_the_pdf_exists_is_a_coded_404(api_client: APIClient, document: BillingDocument, storage: FakeObjectStorage) -> None:
    response = api_client.get(reverse(PDF, args=[document.pk]))

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert [item["code"] for item in errors(response)] == ["billing_document_pdf.not_generated"]


def test_post_generates_and_get_answers_a_signed_url(api_client: APIClient, document: BillingDocument, storage: FakeObjectStorage) -> None:
    created = api_client.post(reverse(PDF, args=[document.pk]))
    fetched = api_client.get(reverse(PDF, args=[document.pk]))

    assert created.status_code == status.HTTP_201_CREATED
    assert fetched.status_code == status.HTTP_200_OK
    pdf = BillingDocumentPdf.objects.get()
    assert body(fetched)["download_url"] == f"https://bucket.test/download/{pdf.file_key}?expires=300"
    assert body(fetched)["expires_in"] == 300
    assert storage.download_requests == [(pdf.file_key, "boleto-rascunho-101-2026-10.pdf")] * 2


def test_post_again_replaces_it_with_a_200(api_client: APIClient, document: BillingDocument, storage: FakeObjectStorage) -> None:
    _ = api_client.post(reverse(PDF, args=[document.pk]))

    again = api_client.post(reverse(PDF, args=[document.pk]))

    assert again.status_code == status.HTTP_200_OK
    assert BillingDocumentPdf.objects.count() == 1


def test_an_unconfigured_bucket_is_a_503(api_client: APIClient, document: BillingDocument) -> None:
    posted = api_client.post(reverse(PDF, args=[document.pk]))

    assert posted.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert [item["code"] for item in errors(posted)] == ["object_storage.unavailable"]


def test_other_company_cannot_reach_the_pdf(other_api_client: APIClient, document: BillingDocument, storage: FakeObjectStorage) -> None:
    assert other_api_client.get(reverse(PDF, args=[document.pk])).status_code == status.HTTP_404_NOT_FOUND
    assert other_api_client.post(reverse(PDF, args=[document.pk])).status_code == status.HTTP_404_NOT_FOUND
    assert not BillingDocumentPdf.objects.exists()


def test_the_pdf_row_is_audited(api_client: APIClient, document: BillingDocument, storage: FakeObjectStorage) -> None:
    _ = api_client.post(reverse(PDF, args=[document.pk]))

    assert LogEntry.objects.get_for_model(BillingDocumentPdf).count() == 1
