"""The bucket client: signed URLs and the coded 503 without settings (spec 018, R4, R7)."""

from typing import Any

import pytest

from apps.core.infrastructure.storage.object_storage import (
    ObjectStorageUnavailable,
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
