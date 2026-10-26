"""The bucket of uploaded files (spec 018): Cloudflare R2 through its S3-compatible API.

Files users send never cross Django: the browser uploads and downloads through short-lived signed URLs (a file the server generates itself, such as a boleto PDF, is uploaded with `put_object`). This
module is the only place that imports `boto3`; callers use `get_object_storage()` and tests replace it
with a fake.
"""

import logging
from typing import Any
from urllib.parse import quote

import boto3  # pyright: ignore[reportMissingTypeStubs]
from botocore.config import Config  # pyright: ignore[reportMissingTypeStubs]
from botocore.exceptions import ClientError  # pyright: ignore[reportMissingTypeStubs]
from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import APIException

from apps.core.infrastructure.errors.object_storage import ObjectStorageError

logger = logging.getLogger(__name__)

NOT_FOUND_CODES = ("404", "NoSuchKey", "NotFound")


class ObjectStorageUnavailable(APIException):
    """The bucket is not configured: the endpoints that need it answer 503."""

    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = ObjectStorageError.UNAVAILABLE.message
    default_code = ObjectStorageError.UNAVAILABLE.value


def content_disposition(file_name: str) -> str:
    """`attachment` header that makes the browser save the file under its original name."""
    printable = "".join(character for character in file_name if character.isprintable())
    return f"attachment; filename*=UTF-8''{quote(printable)}"


class ObjectStorage:
    def __init__(self, client: Any, bucket: str) -> None:
        self._client = client
        self._bucket = bucket

    def presigned_upload_url(self, key: str, content_type: str, expires_in: int) -> str:
        """A URL the browser `PUT`s the file to; the content type is part of the signature."""
        url: str = self._client.generate_presigned_url(
            "put_object",
            Params={"Bucket": self._bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=expires_in,
        )
        return url

    def presigned_download_url(self, key: str, file_name: str, expires_in: int) -> str:
        url: str = self._client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self._bucket,
                "Key": key,
                "ResponseContentDisposition": content_disposition(file_name),
            },
            ExpiresIn=expires_in,
        )
        return url

    def put_object(self, key: str, content: bytes, content_type: str) -> None:
        """Upload a file the server itself produced (a generated PDF); user files go through signed URLs."""
        self._client.put_object(Bucket=self._bucket, Key=key, Body=content, ContentType=content_type)

    def object_size(self, key: str) -> int | None:
        """The real size of the stored object, or `None` when it is not there."""
        try:
            head: dict[str, Any] = self._client.head_object(Bucket=self._bucket, Key=key)
        except ClientError as error:
            if str(error.response.get("Error", {}).get("Code")) in NOT_FOUND_CODES:
                return None
            raise
        return int(head["ContentLength"])

    def delete_object(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)


def get_object_storage() -> ObjectStorage:
    """The bucket client built from the settings; any missing setting is a coded 503."""
    access_key = settings.AWS_ACCESS_KEY_ID
    secret_key = settings.AWS_SECRET_ACCESS_KEY
    bucket = settings.AWS_STORAGE_BUCKET_NAME
    endpoint_url = settings.AWS_S3_ENDPOINT_URL
    if not (access_key and secret_key and bucket and endpoint_url):
        raise ObjectStorageUnavailable()
    client = boto3.client(  # pyright: ignore[reportUnknownMemberType]
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=settings.AWS_S3_REGION_NAME,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    return ObjectStorage(client, bucket)
