"""The bucket client: signed URLs and the coded 503 without settings (spec 018, R4, R7)."""

from typing import Any

import pytest
from botocore.exceptions import ClientError

from apps.core.storage.object_storage import (
    ObjectStorage,
    ObjectStorageUnavailable,
    content_disposition,
    get_object_storage,
)

BUCKET_SETTINGS = {
    "AWS_ACCESS_KEY_ID": "test-key",
    "AWS_SECRET_ACCESS_KEY": "test-secret",
    "AWS_STORAGE_BUCKET_NAME": "receipts",
    "AWS_S3_ENDPOINT_URL": "https://account.r2.cloudflarestorage.com",
}


def test_unset_bucket_raises_a_coded_error(settings: Any) -> None:
    settings.AWS_STORAGE_BUCKET_NAME = ""

    with pytest.raises(ObjectStorageUnavailable) as raised:
        get_object_storage()

    assert raised.value.status_code == 503
    assert raised.value.detail.code == "object_storage.unavailable"  # type: ignore[union-attr]


@pytest.mark.parametrize("missing", list(BUCKET_SETTINGS))
def test_every_setting_is_required(settings: Any, missing: str) -> None:
    for name, value in BUCKET_SETTINGS.items():
        setattr(settings, name, "" if name == missing else value)

    with pytest.raises(ObjectStorageUnavailable):
        get_object_storage()


def test_signed_urls_point_at_the_bucket_and_expire(settings: Any) -> None:
    for name, value in BUCKET_SETTINGS.items():
        setattr(settings, name, value)
    storage = get_object_storage()

    upload = storage.presigned_upload_url("payment-receipts/a/b/c", "application/pdf", 600)
    download = storage.presigned_download_url("payment-receipts/a/b/c", "março.pdf", 300)

    assert upload.startswith("https://account.r2.cloudflarestorage.com/receipts/payment-receipts/a/b/c?")
    assert "X-Amz-Signature=" in upload
    assert "X-Amz-Expires=600" in upload
    assert "X-Amz-Expires=300" in download
    assert "response-content-disposition=attachment" in download


def test_content_disposition_names_the_file_without_control_characters() -> None:
    assert content_disposition("comprovante março.pdf") == "attachment; filename*=UTF-8''comprovante%20mar%C3%A7o.pdf"
    assert content_disposition("a\r\nb\".pdf") == "attachment; filename*=UTF-8''ab%22.pdf"


class StubClient:
    def __init__(self, error_code: str | None = None, length: int = 10) -> None:
        self.error_code = error_code
        self.length = length

    def head_object(self, **_: Any) -> dict[str, Any]:
        if self.error_code:
            raise ClientError({"Error": {"Code": self.error_code}}, "HeadObject")
        return {"ContentLength": self.length}


def test_object_size_is_none_when_the_object_is_missing() -> None:
    assert ObjectStorage(StubClient("404"), "receipts").object_size("k") is None
    assert ObjectStorage(StubClient("NoSuchKey"), "receipts").object_size("k") is None


def test_object_size_reads_the_real_size() -> None:
    assert ObjectStorage(StubClient(length=2048), "receipts").object_size("k") == 2048


def test_object_size_does_not_hide_other_errors() -> None:
    with pytest.raises(ClientError):
        ObjectStorage(StubClient("AccessDenied"), "receipts").object_size("k")
