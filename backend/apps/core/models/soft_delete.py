from typing import Any, ClassVar, Generic, Self, TypeVar, override

from django.db import models
from django.utils import timezone

ModelT = TypeVar("ModelT", bound=models.Model)


class SoftDeleteQuerySet(models.QuerySet[ModelT], Generic[ModelT]):
    """Deleting through a queryset archives each row, so a bulk delete cannot bypass the model's archive rules."""

    @override
    def delete(self) -> tuple[int, dict[str, int]]:
        archived_count = 0
        for instance in self:
            instance.delete()
            archived_count += 1
        return archived_count, {self.model._meta.label: archived_count}

    def hard_delete(self) -> tuple[int, dict[str, int]]:
        """Remove the rows for good (seed cleanup, tests): the one way to really delete."""
        return super().delete()

    def archived(self) -> Self:
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager[ModelT], Generic[ModelT]):
    """The default manager of an archivable model: archived rows are not there."""

    @override
    def get_queryset(self) -> models.QuerySet[ModelT]:
        return super().get_queryset().filter(deleted_at__isnull=True)


class SoftDeleteMixin(models.Model):
    """Registry records are archived instead of deleted: the row stays, with its links and history.

    A model using it defines `objects = SoftDeleteManager.from_queryset(XQuerySet)()` (archived rows hidden) and
    `all_objects = XQuerySet.as_manager()` (every row), with `XQuerySet` inheriting `SoftDeleteQuerySet`.
    Django resolves a foreign key with the base manager (a unit still reaches its archived condominium) and a reverse
    relation with the default manager (`condominium.units` hides archived units).
    """

    deleted_at = models.DateTimeField(null=True, blank=True, editable=False, db_index=True)

    archive_error_field: ClassVar[str] = "__all__"

    class Meta:
        abstract = True

    @property
    def is_archived(self) -> bool:
        return self.deleted_at is not None

    def validate_archivable(self) -> None:
        """Raise a `ValidationError` when the record may not be archived yet; each model overrides it with its `XArchiveRules`."""

    @override
    def delete(self, using: Any = None, keep_parents: bool = False) -> tuple[int, dict[str, int]]:
        self.validate_archivable()
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at"])
        return 1, {self._meta.label: 1}

    def hard_delete(self) -> tuple[int, dict[str, int]]:
        return models.Model.delete(self)

    def restore(self) -> None:
        """Bring the record back; its uniqueness is checked again against the live records."""
        self.deleted_at = None
        self.full_clean()
        self.save(update_fields=["deleted_at"])
