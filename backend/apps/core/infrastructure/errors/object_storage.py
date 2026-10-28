from .base import RuleError


class ObjectStorageError(RuleError):
    UNAVAILABLE = ("object_storage.unavailable", "The file storage is not available.")
