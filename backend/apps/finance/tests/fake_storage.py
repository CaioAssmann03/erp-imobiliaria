"""In-memory stand-in for the bucket (spec 018): the tests never touch the network."""

from typing import Any


class FakeObjectStorage:
    """Same methods as `ObjectStorage`; `objects` maps a key to the size of the file "uploaded" there."""

    def __init__(self) -> None:
        self.objects: dict[str, int] = {}
        self.contents: dict[str, bytes] = {}
        self.download_requests: list[tuple[str, str]] = []
        self.fail_deletes = False

    def presigned_upload_url(self, key: str, content_type: str, expires_in: int) -> str:
        return f"https://bucket.test/upload/{key}?type={content_type}&expires={expires_in}"

    def presigned_download_url(self, key: str, file_name: str, expires_in: int) -> str:
        self.download_requests.append((key, file_name))
        return f"https://bucket.test/download/{key}?expires={expires_in}"

    def put_object(self, key: str, content: bytes, content_type: str) -> None:
        self.objects[key] = len(content)
        self.contents[key] = content

    def object_size(self, key: str) -> int | None:
        return self.objects.get(key)

    def delete_object(self, key: str) -> None:
        if self.fail_deletes:
            raise RuntimeError("bucket unreachable")
        self.objects.pop(key, None)
        self.contents.pop(key, None)


def as_storage(fake: FakeObjectStorage) -> Any:
    return fake
