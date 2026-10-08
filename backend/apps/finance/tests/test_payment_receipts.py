"""Payment receipts: files of a paid account in the bucket, moved by signed URLs (spec 018, R1–R7)."""

from datetime import date
from typing import Any

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.storage import object_storage

from ..models import AccountPayable, PaymentReceipt
from ..services.cancel_account_payable import cancel_account_payable
from ..services.settle_account_payable import (
    AccountPayablePayment,
    settle_account_payable,
)
from ..validators import MAX_RECEIPT_SIZE_BYTES
from .base import body, error_codes, results
from .fake_storage import FakeObjectStorage

pytestmark = pytest.mark.django_db

CREATE = "account-payable-receipts"
LIST = "payment-receipt-list"
DETAIL = "payment-receipt-detail"
CONFIRM = "payment-receipt-confirm"
DOWNLOAD = "payment-receipt-download-url"

NOT_PAID = "payment_receipt.account_payable.not_paid"
NOT_ALLOWED = "payment_receipt.content_type.not_allowed"
TOO_LARGE = "payment_receipt.size_bytes.too_large"
NOT_POSITIVE = "payment_receipt.size_bytes.not_positive"
MISSING = "payment_receipt.file.missing_in_storage"
MISMATCH = "payment_receipt.file.size_mismatch"
ALREADY_CONFIRMED = "payment_receipt.already_confirmed"
UNAVAILABLE = "object_storage.unavailable"


@pytest.fixture
def storage(monkeypatch: pytest.MonkeyPatch) -> FakeObjectStorage:
    fake = FakeObjectStorage()
    monkeypatch.setattr(object_storage, "get_object_storage", lambda: fake)
    return fake


@pytest.fixture
def paid_account(make_account: Any, staff_user: Any) -> AccountPayable:
    account: AccountPayable = make_account()
    settle_account_payable(account, AccountPayablePayment(date(2026, 10, 19), account.amount, "pix", staff_user))
    return account


def file_payload(**overrides: object) -> dict[str, object]:
    return {"original_name": "comprovante.pdf", "content_type": "application/pdf", "size_bytes": 2048, **overrides}


def request_upload(client: APIClient, account: AccountPayable, **overrides: object) -> Any:
    return client.post(reverse(CREATE, args=[account.pk]), file_payload(**overrides), format="json")


def uploaded_receipt(client: APIClient, account: AccountPayable, storage: FakeObjectStorage, **overrides: object) -> str:
    """Ask for the upload URL and "upload" the file; returns the receipt id (not yet confirmed)."""
    created = request_upload(client, account, **overrides)
    assert created.status_code == status.HTTP_201_CREATED, created.data
    receipt = PaymentReceipt.objects.get(pk=body(created)["id"])
    storage.objects[receipt.file_key] = receipt.size_bytes
    return str(receipt.pk)


def confirmed_receipt(client: APIClient, account: AccountPayable, storage: FakeObjectStorage, **overrides: object) -> str:
    receipt_id = uploaded_receipt(client, account, storage, **overrides)
    assert client.post(reverse(CONFIRM, args=[receipt_id])).status_code == status.HTTP_200_OK
    return receipt_id


# ----- R1 -----


def test_attaches_a_receipt_to_a_paid_account(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage, staff_user: Any
) -> None:
    response = request_upload(api_client, paid_account)

    assert response.status_code == status.HTTP_201_CREATED, response.data
    receipt = PaymentReceipt.objects.get(pk=body(response)["id"])
    assert receipt.confirmed_at is None
    assert receipt.uploaded_by == staff_user
    assert receipt.file_key.startswith(f"payment-receipts/{paid_account.company_id}/{paid_account.pk}/")
    assert "comprovante" not in receipt.file_key
    assert body(response)["upload_url"].startswith("https://bucket.test/upload/")
    assert body(response)["upload_headers"] == {"Content-Type": "application/pdf"}


def test_open_account_refuses_a_receipt(api_client: APIClient, make_account: Any, storage: FakeObjectStorage) -> None:
    response = request_upload(api_client, make_account())

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "account_payable") == [NOT_PAID]
    assert PaymentReceipt.objects.count() == 0


def test_cancelled_account_refuses_a_receipt(api_client: APIClient, make_account: Any, storage: FakeObjectStorage) -> None:
    account = make_account()
    cancel_account_payable(account)

    response = request_upload(api_client, account)

    assert error_codes(response, "account_payable") == [NOT_PAID]


# ----- R2 -----


@pytest.mark.parametrize("content_type", ["text/plain", "image/gif", "application/zip"])
def test_refuses_a_type_that_is_not_allowed(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage, content_type: str
) -> None:
    response = request_upload(api_client, paid_account, content_type=content_type)

    assert error_codes(response, "content_type") == [NOT_ALLOWED]


@pytest.mark.parametrize(
    ("size_bytes", "code"),
    [(0, NOT_POSITIVE), (MAX_RECEIPT_SIZE_BYTES + 1, TOO_LARGE)],
)
def test_refuses_an_empty_or_oversized_file(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage, size_bytes: int, code: str
) -> None:
    response = request_upload(api_client, paid_account, size_bytes=size_bytes)

    assert error_codes(response, "size_bytes") == [code]
    assert PaymentReceipt.objects.count() == 0


def test_accepts_the_size_limit_and_every_allowed_type(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    for content_type in ("application/pdf", "image/jpeg", "image/png"):
        response = request_upload(api_client, paid_account, content_type=content_type, size_bytes=MAX_RECEIPT_SIZE_BYTES)
        assert response.status_code == status.HTTP_201_CREATED, response.data


def test_confirm_rejects_and_deletes_a_size_mismatch(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    receipt_id = uploaded_receipt(api_client, paid_account, storage, size_bytes=2048)
    key = PaymentReceipt.objects.get(pk=receipt_id).file_key
    storage.objects[key] = 4096  # the browser sent another file than it announced

    response = api_client.post(reverse(CONFIRM, args=[receipt_id]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == [MISMATCH]
    assert not PaymentReceipt.objects.filter(pk=receipt_id).exists()
    assert key not in storage.objects


def test_confirm_rejects_a_missing_object(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    created = request_upload(api_client, paid_account)  # nothing is uploaded
    receipt_id = body(created)["id"]

    response = api_client.post(reverse(CONFIRM, args=[receipt_id]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == [MISSING]
    assert not PaymentReceipt.objects.filter(pk=receipt_id).exists()


def test_confirm_marks_the_receipt_and_cannot_repeat(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    receipt_id = uploaded_receipt(api_client, paid_account, storage)

    confirmed = api_client.post(reverse(CONFIRM, args=[receipt_id]))
    again = api_client.post(reverse(CONFIRM, args=[receipt_id]))

    assert confirmed.status_code == status.HTTP_200_OK
    assert body(confirmed)["confirmed_at"] is not None
    assert again.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(again, None) == [ALREADY_CONFIRMED]


# ----- R3 -----


def test_lists_only_confirmed_receipts_of_the_account(
    api_client: APIClient, paid_account: AccountPayable, make_account: Any, staff_user: Any, storage: FakeObjectStorage
) -> None:
    confirmed_id = confirmed_receipt(api_client, paid_account, storage)
    uploaded_receipt(api_client, paid_account, storage)  # never confirmed
    other = make_account(description="Outra conta")
    settle_account_payable(other, AccountPayablePayment(date(2026, 10, 19), other.amount, "pix", staff_user))
    confirmed_receipt(api_client, other, storage)

    response = api_client.get(reverse(LIST), {"account_payable": str(paid_account.pk)})

    assert [row["id"] for row in results(response)] == [confirmed_id]
    row = results(response)[0]
    assert row["original_name"] == "comprovante.pdf"
    assert row["content_type"] == "application/pdf"
    assert row["size_bytes"] == 2048
    assert row["uploaded_by_name"] == "tester"


def test_an_account_may_have_several_receipts(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    confirmed_receipt(api_client, paid_account, storage, original_name="banco.pdf")
    confirmed_receipt(api_client, paid_account, storage, original_name="nota.png", content_type="image/png")

    response = api_client.get(reverse(LIST), {"account_payable": str(paid_account.pk)})

    assert {row["original_name"] for row in results(response)} == {"banco.pdf", "nota.png"}


# ----- R4 -----


def test_download_url_is_signed_and_names_the_file(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    receipt_id = confirmed_receipt(api_client, paid_account, storage, original_name="comprovante março.pdf")

    response = api_client.get(reverse(DOWNLOAD, args=[receipt_id]))

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["download_url"].startswith("https://bucket.test/download/")
    assert body(response)["expires_in"] == 300
    assert storage.download_requests == [(PaymentReceipt.objects.get(pk=receipt_id).file_key, "comprovante março.pdf")]


def test_an_unconfirmed_receipt_has_no_download_url(
    api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    receipt_id = uploaded_receipt(api_client, paid_account, storage)

    assert api_client.get(reverse(DOWNLOAD, args=[receipt_id])).status_code == status.HTTP_404_NOT_FOUND


# ----- R5 -----


def test_delete_removes_the_row_and_the_object(
    api_client: APIClient,
    paid_account: AccountPayable,
    storage: FakeObjectStorage,
    django_capture_on_commit_callbacks: Any,
) -> None:
    receipt_id = confirmed_receipt(api_client, paid_account, storage)
    key = PaymentReceipt.objects.get(pk=receipt_id).file_key

    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.delete(reverse(DETAIL, args=[receipt_id]))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not PaymentReceipt.objects.filter(pk=receipt_id).exists()
    assert key not in storage.objects


def test_delete_leaves_no_row_pointing_at_nothing(
    api_client: APIClient,
    paid_account: AccountPayable,
    storage: FakeObjectStorage,
    django_capture_on_commit_callbacks: Any,
) -> None:
    receipt_id = confirmed_receipt(api_client, paid_account, storage)
    storage.fail_deletes = True  # the bucket is unreachable: only an orphan object may remain

    with django_capture_on_commit_callbacks(execute=True):
        response = api_client.delete(reverse(DETAIL, args=[receipt_id]))

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not PaymentReceipt.objects.filter(pk=receipt_id).exists()


# ----- R6 -----


def test_another_company_receipt_is_404(
    api_client: APIClient, other_api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    receipt_id = confirmed_receipt(api_client, paid_account, storage)

    assert other_api_client.post(reverse(CONFIRM, args=[receipt_id])).status_code == status.HTTP_404_NOT_FOUND
    assert other_api_client.get(reverse(DOWNLOAD, args=[receipt_id])).status_code == status.HTTP_404_NOT_FOUND
    assert other_api_client.delete(reverse(DETAIL, args=[receipt_id])).status_code == status.HTTP_404_NOT_FOUND
    assert results(other_api_client.get(reverse(LIST))) == []
    assert PaymentReceipt.objects.filter(pk=receipt_id).exists()


def test_another_company_account_is_404(
    other_api_client: APIClient, paid_account: AccountPayable, storage: FakeObjectStorage
) -> None:
    response = request_upload(other_api_client, paid_account)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert PaymentReceipt.objects.count() == 0


# ----- R7 -----


def test_endpoints_answer_503_without_the_bucket(
    api_client: APIClient, paid_account: AccountPayable, settings: Any
) -> None:
    settings.AWS_STORAGE_BUCKET_NAME = ""

    response = request_upload(api_client, paid_account)

    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert error_codes(response, None) == [UNAVAILABLE]
    assert PaymentReceipt.objects.count() == 0
    assert api_client.get(reverse("account-payable-list")).status_code == status.HTTP_200_OK
