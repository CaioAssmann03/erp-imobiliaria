from datetime import date
from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction

from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from ..serializers import UnitPersonSerializer


def validate(**attrs: object) -> dict[str, object]:
    return UnitPersonSerializer().validate(attrs)


def test_owner_requires_percentage() -> None:
    with pytest.raises(Exception) as exc:
        _ = validate(role="owner", start_date=date(2025, 1, 1))

    assert "ownership_percentage" in str(exc.value)


@pytest.mark.parametrize("percentage", [Decimal("-1"), Decimal("100.01")])
def test_owner_percentage_must_be_between_0_and_100(percentage: Decimal) -> None:
    with pytest.raises(Exception) as exc:
        _ = validate(role="owner", ownership_percentage=percentage)

    assert "ownership_percentage" in str(exc.value)


def test_owner_with_valid_percentage_is_accepted() -> None:
    attrs = {"role": "owner", "ownership_percentage": Decimal("50")}

    assert validate(**attrs) == attrs


def test_tenant_cannot_have_percentage() -> None:
    with pytest.raises(Exception) as exc:
        _ = validate(role="tenant", ownership_percentage=Decimal("10"))

    assert "ownership_percentage" in str(exc.value)


def test_tenant_without_percentage_is_accepted() -> None:
    attrs = {"role": "tenant", "start_date": date(2025, 1, 1)}

    assert validate(**attrs) == attrs


def test_end_date_cannot_be_before_start_date() -> None:
    with pytest.raises(Exception) as exc:
        _ = validate(
            role="tenant", start_date=date(2025, 6, 1), end_date=date(2025, 1, 1)
        )

    assert "end_date" in str(exc.value)


@pytest.fixture
def unit(condominium: Condominium) -> Unit:
    return Unit.objects.create(condominium=condominium, name="101")


@pytest.fixture
def person() -> Person:
    return Person.objects.create(name="Maria")


@pytest.mark.django_db
class TestUnitPersonConstraints:
    def test_database_rejects_end_before_start(self, unit: Unit, person: Person) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = UnitPerson.objects.create(
                unit=unit,
                person=person,
                start_date=date(2025, 6, 1),
                end_date=date(2025, 1, 1),
            )

    def test_database_rejects_tenant_with_percentage(
        self, unit: Unit, person: Person
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = UnitPerson.objects.create(
                unit=unit,
                person=person,
                role="tenant",
                ownership_percentage=Decimal("10"),
                start_date=date(2025, 1, 1),
            )

    def test_database_rejects_owner_without_percentage(
        self, unit: Unit, person: Person
    ) -> None:
        with pytest.raises(IntegrityError), transaction.atomic():
            _ = UnitPerson.objects.create(
                unit=unit, person=person, role="owner", start_date=date(2025, 1, 1)
            )

    def test_only_one_active_link_per_role(self, unit: Unit, person: Person) -> None:
        _ = UnitPerson.objects.create(
            unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)
        )

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = UnitPerson.objects.create(
                unit=unit, person=person, role="tenant", start_date=date(2025, 2, 1)
            )

    def test_new_link_is_allowed_after_previous_one_ended(
        self, unit: Unit, person: Person
    ) -> None:
        _ = UnitPerson.objects.create(
            unit=unit,
            person=person,
            role="tenant",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
        )

        _ = UnitPerson.objects.create(
            unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)
        )

    def test_same_person_can_be_owner_and_tenant(
        self, unit: Unit, person: Person
    ) -> None:
        _ = UnitPerson.objects.create(
            unit=unit,
            person=person,
            role="owner",
            ownership_percentage=Decimal("100"),
            start_date=date(2025, 1, 1),
        )

        _ = UnitPerson.objects.create(
            unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)
        )
