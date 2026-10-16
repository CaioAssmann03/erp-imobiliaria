"""Domain behaviour owned by the models (used by the dashboard and any other caller)."""

from datetime import date
from decimal import Decimal

import pytest

from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import AdministrationContract, BillingRules, Condominium, Unit, UnitPerson


class TestBillingMonths:
    """The reference month is the month the issuance refers to (the Sami's "referência")."""

    @pytest.mark.parametrize(
        ("due_month", "competence_month", "due", "competence"),
        [
            ("following", "same_as_due", date(2026, 11, 1), date(2026, 11, 1)),
            ("following", "before_due", date(2026, 11, 1), date(2026, 10, 1)),
            ("reference", "same_as_due", date(2026, 10, 1), date(2026, 10, 1)),
            ("reference", "before_due", date(2026, 10, 1), date(2026, 9, 1)),
        ],
    )
    def test_due_month_and_competence_month_of_a_reference_month(
        self, due_month: str, competence_month: str, due: date, competence: date
    ) -> None:
        billing_rules = BillingRules(due_month=due_month, competence_month=competence_month)
        reference_month = date(2026, 10, 17)  # any day of the month

        assert billing_rules.due_month_of(reference_month) == due
        assert billing_rules.competence_month_of(reference_month) == competence

    def test_the_months_cross_the_year_boundary(self) -> None:
        following = BillingRules(due_month="following", competence_month="same_as_due")
        before_due = BillingRules(due_month="reference", competence_month="before_due")

        assert following.due_month_of(date(2026, 12, 31)) == date(2027, 1, 1)
        assert before_due.competence_month_of(date(2027, 1, 5)) == date(2026, 12, 1)


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
        _ = UnitPerson.objects.create(  # ended before the reference date: not current
            unit=unit, person=person, role="owner", ownership_percentage=Decimal("50"),
            start_date=date(2023, 1, 1), end_date=date(2024, 12, 31),
        )

        current_links = set(UnitPerson.objects.current(reference_date))

        assert current_links == {open_link, ends_on_reference_date}


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
