from typing import TYPE_CHECKING

from django.db.models import Q
from django.utils import timezone

from apps.core.models.rules import ModelRules, rule
from apps.persons.errors import PersonError

if TYPE_CHECKING:
    from apps.persons.models.person import Person  # noqa: F401

NOT_A_FIELD = "__all__"


class PersonArchiveRules(ModelRules["Person"]):
    """A person who still holds a live role cannot be deleted (archived): the roles are ended first."""

    @rule(NOT_A_FIELD, PersonError.ARCHIVE_HAS_CURRENT_LINKS)
    def has_current_links(self) -> bool:
        today = timezone.localdate()
        return self.instance.unit_links.filter(
            Q(end_date__isnull=True) | Q(end_date__gte=today), unit__deleted_at__isnull=True
        ).exists()

    @rule(NOT_A_FIELD, PersonError.ARCHIVE_IS_ACTIVE_SUPPLIER)
    def is_active_supplier(self) -> bool:
        supplier = getattr(self.instance, "supplier", None)
        return supplier is not None and not supplier.is_archived and supplier.active

    @rule(NOT_A_FIELD, PersonError.ARCHIVE_IS_ADVISOR)
    def is_advisor(self) -> bool:
        return self.instance.advisor_condominium.exists()
