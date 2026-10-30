from datetime import date
from typing import TYPE_CHECKING

from django.utils import timezone

from apps.core.models.rules import ModelRules, rule
from apps.persons.errors import PersonError

if TYPE_CHECKING:
    from apps.persons.models.person import Person  # noqa: F401

NOT_A_FIELD = "__all__"
RETENTION_YEARS = 5


def _add_years(day: date, years: int) -> date:
    try:
        return day.replace(year=day.year + years)
    except ValueError:  # 29 February
        return day.replace(year=day.year + years, day=28)


class PersonAnonymizeRules(ModelRules["Person"]):
    """A person is anonymized (the LGPD erasure) only after being deleted and only once the legal retention period has passed.

    The period counts from the last time the person appears in a financial record: the day they were deleted, the end of
    their last unit link, the due date of the last boleto they were the payer of and of the last account payable of their supplier.
    """

    @rule(NOT_A_FIELD, PersonError.ANONYMIZE_NOT_ARCHIVED)
    def is_not_archived(self) -> bool:
        return not self.instance.is_archived

    @rule(NOT_A_FIELD, PersonError.ANONYMIZE_ALREADY_DONE)
    def is_already_anonymized(self) -> bool:
        return self.instance.anonymized_at is not None

    @rule(NOT_A_FIELD, PersonError.ANONYMIZE_RETENTION_PERIOD)
    def is_within_retention_period(self) -> bool:
        return timezone.localdate() < _add_years(self.last_financial_date(), RETENTION_YEARS)

    def last_financial_date(self) -> date:
        person = self.instance
        days: list[date] = [timezone.localtime(person.deleted_at).date()] if person.deleted_at else []
        for link in person.unit_links.all():
            days.append(link.end_date or link.start_date)
        days.extend(person.billing_documents.values_list("due_date", flat=True))
        supplier = getattr(person, "supplier", None)
        if supplier is not None:
            days.extend(supplier.accounts_payable.values_list("due_date", flat=True))
        return max(days)
