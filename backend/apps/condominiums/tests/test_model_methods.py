"""Domain behaviour owned by the models (used by the dashboard and any other caller)."""

from datetime import date
from decimal import Decimal

import pytest

from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import AdministrationContract, Condominium, Unit, UnitPerson


class TestContractAdjustment:
    def test_next_adjustment_is_base_plus_period(self) -> None:
        contract = AdministrationContract(
            adjustment_base_date=date(2025, 3, 15), adjustment_period_months=12
        )

        assert contract.next_adjustment_date() == date(2026, 3, 15)

    def test_day_is_clamped_to_the_end_of_the_month(self) -> None:
        contract = AdministrationContract(
            adjustment_base_date=date(2025, 8, 31), adjustment_period_months=6
        )

        assert contract.next_adjustment_date() == date(2026, 2, 28)

    def test_without_base_date_there_is_no_adjustment(self) -> None:
        contract = AdministrationContract(adjustment_base_date=None)

        assert contract.next_adjustment_date() is None
        assert not contract.is_adjustment_overdue(date(2030, 1, 1))

    def test_overdue_only_after_the_due_date(self) -> None:
        contract = AdministrationContract(
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
        ended = UnitPerson.objects.create(
            unit=unit, person=person, role="owner", ownership_percentage=Decimal("50"),
            start_date=date(2023, 1, 1), end_date=date(2024, 12, 31),
        )

        current_links = set(UnitPerson.objects.current(reference_date))

        assert current_links == {open_link, ends_on_reference_date}
        assert open_link.is_current(reference_date) and ends_on_reference_date.is_current(reference_date)
        assert not ended.is_current(reference_date)


@pytest.mark.django_db
class TestApportionment:
    def test_flags_only_condominiums_that_do_not_sum_to_one(self, condominium: Condominium) -> None:
        other = Condominium.objects.create(
            company=condominium.company, name="Outro", cnpj="45723174000110"
        )
        for name in ("1", "2"):
            _ = Unit.objects.create(condominium=condominium, name=name, ideal_fraction=Decimal("0.5"))
        _ = Unit.objects.create(condominium=other, name="1", ideal_fraction=Decimal("0.9"))

        assert Unit.objects.inconsistent_apportionment_condominium_ids() == [other.pk]
