from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING, NamedTuple

from apps.condominiums.errors import UnitPersonError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.unit_person import UnitPerson  # noqa: F401

MAXIMUM_OWNERSHIP_PERCENTAGE = Decimal(100)


class OwnershipPeriod(NamedTuple):
    start_date: date
    end_date: date | None
    percentage: Decimal

    def covers(self, day: date) -> bool:
        return self.start_date <= day and (
            self.end_date is None or self.end_date >= day
        )


class UnitPersonRules(ModelRules["UnitPerson"]):
    @rule("ownership_percentage", UnitPersonError.PERCENTAGE_REQUIRED_FOR_OWNER)
    def owner_lacks_percentage(self) -> bool:
        link = self.instance
        return link.role == link.Role.OWNER and link.ownership_percentage is None

    @rule("ownership_percentage", UnitPersonError.PERCENTAGE_NOT_ALLOWED_FOR_TENANT)
    def tenant_has_percentage(self) -> bool:
        link = self.instance
        return link.role == link.Role.TENANT and link.ownership_percentage is not None

    @rule("end_date", UnitPersonError.END_DATE_BEFORE_START_DATE)
    def ends_before_it_starts(self) -> bool:
        link = self.instance
        return bool(
            link.start_date and link.end_date and link.end_date < link.start_date
        )

    @rule("person", UnitPersonError.PERSON_OTHER_COMPANY)
    def person_belongs_to_another_company(self) -> bool:
        link = self.instance
        if link.person_id is None or link.unit_id is None:
            return False
        return link.person.company_id != link.unit.condominium.company_id

    @rule("ownership_percentage", UnitPersonError.PERCENTAGE_SUM_EXCEEDS_100)
    def owners_share_exceeds_100_percent(self) -> bool:
        """At no moment can the owners of the unit hold more than 100% together."""
        link = self.instance
        if (
            link.role != link.Role.OWNER
            or link.ownership_percentage is None
            or link.start_date is None
            or link.unit_id is None
        ):
            return False
        other_owner_links = (
            type(link)
            .objects.filter(unit_id=link.unit_id, role=link.Role.OWNER)
            .exclude(pk=link.pk)
        )
        periods = [
            OwnershipPeriod(
                other.start_date,
                other.end_date,
                other.ownership_percentage or Decimal(0),
            )
            for other in other_owner_links
        ]
        periods.append(
            OwnershipPeriod(link.start_date, link.end_date, link.ownership_percentage)
        )
        return any(
            sum(
                (
                    period.percentage
                    for period in periods
                    if period.covers(checked.start_date)
                ),
                Decimal(0),
            )
            > MAXIMUM_OWNERSHIP_PERCENTAGE
            for checked in periods
        )
