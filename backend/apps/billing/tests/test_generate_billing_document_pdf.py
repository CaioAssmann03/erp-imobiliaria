"""Generating, storing and replacing the draft PDF (spec 027, R3, R4, R7)."""

from typing import Any

import pytest

from apps.billing.models import CondominiumBillingRules
from apps.core.infrastructure.storage import object_storage
from apps.core.infrastructure.storage.object_storage import ObjectStorageUnavailable
from apps.finance.tests.fake_storage import FakeObjectStorage

from .. import tasks
from ..models import BillingDocument, BillingDocumentPdf
from ..services.generate_billing_document_pdf import generate_billing_document_pdf
from ..services.issue_condominium_billing import issue_condominium_billing

pytestmark = pytest.mark.django_db


@pytest.fixture
def storage(monkeypatch: pytest.MonkeyPatch) -> FakeObjectStorage:
    fake = FakeObjectStorage()
    monkeypatch.setattr(object_storage, "get_object_storage", lambda: fake)
    return fake


def test_the_pdf_is_stored_in_the_bucket_and_linked_to_the_document(document: BillingDocument, storage: FakeObjectStorage) -> None:
    pdf = generate_billing_document_pdf(document)

    assert pdf.document == document
    assert pdf.file_key.startswith(f"billing-documents/{document.unit.condominium.company_id}/{document.pk}/")
    assert pdf.file_key.endswith(".pdf")
    assert storage.contents[pdf.file_key].startswith(b"%PDF")
    assert pdf.size_bytes == len(storage.contents[pdf.file_key])


def test_generating_again_replaces_the_pdf_and_deletes_the_old_file(  # type: ignore[no-untyped-def]
    document: BillingDocument, storage: FakeObjectStorage, django_capture_on_commit_callbacks
) -> None:
    first = generate_billing_document_pdf(document)
    old_key = first.file_key

    with django_capture_on_commit_callbacks(execute=True):
        second = generate_billing_document_pdf(document)

    assert BillingDocumentPdf.objects.count() == 1
    assert second.pk == first.pk and second.file_key != old_key
    assert old_key not in storage.objects and second.file_key in storage.objects


def test_a_failed_delete_of_the_old_file_does_not_fail_the_generation(  # type: ignore[no-untyped-def]
    document: BillingDocument, storage: FakeObjectStorage, django_capture_on_commit_callbacks
) -> None:
    _ = generate_billing_document_pdf(document)
    storage.fail_deletes = True

    with django_capture_on_commit_callbacks(execute=True):
        pdf = generate_billing_document_pdf(document)

    assert pdf.file_key in storage.objects


def test_an_unconfigured_bucket_is_a_503(document: BillingDocument) -> None:
    with pytest.raises(ObjectStorageUnavailable):
        _ = generate_billing_document_pdf(document)

    assert not BillingDocumentPdf.objects.exists()


def test_the_task_generates_the_pdf_of_a_document(document: BillingDocument, storage: FakeObjectStorage) -> None:
    pdf_id = tasks.generate_billing_document_pdf_task(str(document.pk))

    assert BillingDocumentPdf.objects.get(pk=pdf_id).document == document


def test_the_issuance_enqueues_a_pdf_per_issued_document_after_it_commits(  # type: ignore[no-untyped-def]
    condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item, monkeypatch: pytest.MonkeyPatch, django_capture_on_commit_callbacks
) -> None:
    from datetime import date

    sent: list[tuple[str, list[Any]]] = []
    monkeypatch.setattr(
        "apps.billing.services.issue_condominium_billing.celery_app.send_task",
        lambda name, args: sent.append((name, args)),
    )
    link(make_unit("101"), "Maria")
    _ = make_plan_item()

    with django_capture_on_commit_callbacks(execute=False) as callbacks:
        _ = issue_condominium_billing(condominium, date(2026, 10, 1))

    assert sent == []  # nothing is sent before the transaction commits
    for callback in callbacks:
        callback()
    document = BillingDocument.objects.get()
    assert sent == [("apps.billing.tasks.generate_billing_document_pdf_task", [str(document.pk)])]


def test_an_issuance_that_finds_the_unit_issued_enqueues_nothing(  # type: ignore[no-untyped-def]
    condominium, billing_rules: CondominiumBillingRules, make_unit, link, make_plan_item, monkeypatch: pytest.MonkeyPatch, django_capture_on_commit_callbacks
) -> None:
    from datetime import date

    link(make_unit("101"), "Maria")
    _ = make_plan_item()
    _ = issue_condominium_billing(condominium, date(2026, 10, 1))
    sent: list[str] = []
    monkeypatch.setattr(
        "apps.billing.services.issue_condominium_billing.celery_app.send_task", lambda name, args: sent.append(name)
    )

    with django_capture_on_commit_callbacks(execute=True):
        _ = issue_condominium_billing(condominium, date(2026, 10, 1))

    assert sent == []
