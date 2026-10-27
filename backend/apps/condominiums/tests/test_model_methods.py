"""Domain behaviour owned by the models (used by the dashboard and any other caller)."""

from datetime import date
from decimal import Decimal

import pytest

from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import CondominiumAdministrationContract, Condominium, Unit, UnitPerson


class TestContractAdjustment:

    def test_day_is_clamped_to_the_end_of_the_month(self) -> None:
        contract = CondominiumAdministrationContract(
            adjustment_base_date=date(2025, 8, 31), adjustment_period_months=6
        )

        assert contract.next_adjustment_date() == date(2026, 2, 28)


    def test_overdue_only_after_the_due_date(self) -> None:
        contract = CondominiumAdministrationContract(
            adjustment_base_date=date(2025, 1, 10), adjustment_period_months=12
        )

        assert not contract.is_adjustment_overdue(date(2026, 1, 10))
        assert contract.is_adjustment_overdue(date(2026, 1, 11))


@pytest.mark.django_db
class TestCurrentLinks:
    def test_current_means_no_end_date_or_not_yet_ended(self, condominium: Condominium) -> None:
        unit = Unit.objects.create(condominium=condominium, name="101")
        person = Person.objects.create(company=seeded_company(), name="Maria")
        reference_date = date(2025, 6, 1)
        open_link = UnitPerson.objects.create(
            unit=unit, person=person, role="tenant", start_date=date(2024, 1, 1)
        )
        ends_on_reference_date = UnitPerson.objects.create(
            unit=unit, person=person, role="owner", ownership_percentage=Decimal("50"),
            start_date=date(2024, 1, 1), end_date=reference_date,
        )
        _ = UnitPerson.objects.create(  # ended before the reference date: not current
            unit=unit, person=person, role="owner", ownership_percentage=Decimal("50"),
            start_date=date(2023, 1, 1), end_date=date(2024, 12, 31),
        )

        current_links = set(UnitPerson.objects.current(reference_date))

        assert current_links == {open_link, ends_on_reference_date}
