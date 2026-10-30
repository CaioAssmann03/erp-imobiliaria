from typing import TYPE_CHECKING

from django.db.models import Q
from django.utils import timezone

from apps.condominiums.errors import UnitError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    from apps.condominiums.models.unit import Unit  # noqa: F401

NOT_A_FIELD = "__all__"


class UnitArchiveRules(ModelRules["Unit"]):
    @rule(NOT_A_FIELD, UnitError.ARCHIVE_HAS_CURRENT_PEOPLE)
    def has_current_people(self) -> bool:
        today = timezone.localdate()
        return self.instance.unit_people.filter(Q(end_date__isnull=True) | Q(end_date__gte=today)).exists()

    @rule(NOT_A_FIELD, UnitError.ARCHIVE_HAS_OPEN_BILLING_DOCUMENTS)
    def has_open_billing_documents(self) -> bool:
        billing_documents = self.instance.billing_documents
        return billing_documents.filter(status__in=billing_documents.model.AWAITING_PAYMENT_STATUSES).exists()
