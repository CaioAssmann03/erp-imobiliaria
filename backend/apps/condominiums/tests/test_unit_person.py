from datetime import date
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.testing import seeded_company
from apps.persons.models import Person

from ..models import Condominium, Unit, UnitPerson
from ..serializers import UnitPersonSerializer


def link(**fields: object) -> UnitPerson:
    return UnitPerson(**{"start_date": date(2025, 1, 1), **fields})


def clean_errors(instance: UnitPerson) -> dict[str, list[str]]:
    with pytest.raises(ValidationError) as exc:
        instance.clean()
    return exc.value.message_dict


class TestUnitPersonModelRules:
    """Rules live in `UnitPerson.clean()` and the field validators; no database needed."""

    def test_owner_requires_percentage(self) -> None:
        assert "ownership_percentage" in clean_errors(link(role="owner"))

    def test_owner_with_percentage_is_valid(self) -> None:
        link(role="owner", ownership_percentage=Decimal("50")).clean()

    @pytest.mark.parametrize("percentage", [Decimal("-1"), Decimal("100.01")])
    def test_percentage_field_validator_rejects_out_of_range(
        self, percentage: Decimal
    ) -> None:
        instance = link(role="owner", ownership_percentage=percentage)

        with pytest.raises(ValidationError) as exc:
            instance.clean_fields(exclude=["unit", "person"])

        assert "ownership_percentage" in exc.value.message_dict

    def test_tenant_cannot_have_percentage(self) -> None:
        errors = clean_errors(link(role="tenant", ownership_percentage=Decimal("10")))

        assert "ownership_percentage" in errors

    def test_tenant_without_percentage_is_valid(self) -> None:
        link(role="tenant").clean()

    def test_end_date_cannot_be_before_start_date(self) -> None:
        errors = clean_errors(
            link(role="tenant", start_date=date(2025, 6, 1), end_date=date(2025, 1, 1))
        )

        assert "end_date" in errors


@pytest.fixture
def unit(condominium: Condominium) -> Unit:
    return Unit.objects.create(condominium=condominium, name="101")


@pytest.fixture
def person() -> Person:
    return Person.objects.create(company=seeded_company(), name="Maria")


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


@pytest.mark.django_db
class TestUnitPersonSerializerUsesTheModelRules:
    def test_owner_without_percentage_is_a_field_error(
        self, unit: Unit, person: Person
    ) -> None:
        serializer = UnitPersonSerializer(
            data={
                "unit": unit.pk,
                "person": person.pk,
                "role": "owner",
                "start_date": "2025-01-01",
            }
        )

        assert not serializer.is_valid()
        assert "ownership_percentage" in serializer.errors

    def test_duplicate_active_link_is_a_400_not_a_500(
        self, unit: Unit, person: Person
    ) -> None:
        _ = UnitPerson.objects.create(
            unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)
        )
        serializer = UnitPersonSerializer(
            data={
                "unit": unit.pk,
                "person": person.pk,
                "role": "tenant",
                "start_date": "2025-02-01",
            }
        )

        assert not serializer.is_valid()


@pytest.mark.django_db
class TestOwnersCap:
    """At no date may the owners of a unit sum more than 100%."""

    def owner(self, unit: Unit, person: Person, pct: str, start: date, end: date | None = None) -> UnitPerson:
        return UnitPerson(
            unit=unit, person=person, role="owner", ownership_percentage=Decimal(pct),
            start_date=start, end_date=end,
        )

    def other_person(self, name: str) -> Person:
        return Person.objects.create(company=seeded_company(), name=name)

    def test_overlapping_owners_over_100_are_rejected(self, unit: Unit, person: Person) -> None:
        self.owner(unit, person, "60", date(2024, 1, 1)).save()

        with pytest.raises(ValidationError) as exc:
            self.owner(unit, self.other_person("B"), "50", date(2024, 6, 1)).clean()

        assert "ownership_percentage" in exc.value.message_dict

    def test_owners_summing_exactly_100_are_accepted(self, unit: Unit, person: Person) -> None:
        self.owner(unit, person, "60", date(2024, 1, 1)).save()

        self.owner(unit, self.other_person("B"), "40", date(2024, 6, 1)).clean()

    def test_a_past_owner_does_not_block_a_new_one(self, unit: Unit, person: Person) -> None:
        self.owner(unit, person, "100", date(2020, 1, 1), date(2023, 12, 31)).save()

        self.owner(unit, self.other_person("B"), "100", date(2024, 1, 1)).clean()

    def test_the_sum_is_checked_at_every_start_date(self, unit: Unit, person: Person) -> None:
        # A: 60 until 2024-12-31; B: 30 from 2024-06-01. A new C of 20 from 2025-01-01 is fine
        # (only B active), but 20 from 2024-07-01 overlaps both (60+30+20 > 100).
        self.owner(unit, person, "60", date(2024, 1, 1), date(2024, 12, 31)).save()
        self.owner(unit, self.other_person("B"), "30", date(2024, 6, 1)).save()

        self.owner(unit, self.other_person("C"), "20", date(2025, 1, 1)).clean()
        with pytest.raises(ValidationError):
            self.owner(unit, self.other_person("D"), "20", date(2024, 7, 1)).clean()

    def test_updating_a_link_does_not_count_itself(self, unit: Unit, person: Person) -> None:
        link = self.owner(unit, person, "70", date(2024, 1, 1))
        link.save()

        link.ownership_percentage = Decimal("100")
        link.clean()

    def test_tenants_do_not_count(self, unit: Unit, person: Person) -> None:
        UnitPerson.objects.create(unit=unit, person=person, role="tenant", start_date=date(2024, 1, 1))

        self.owner(unit, self.other_person("B"), "100", date(2024, 1, 1)).clean()

    def test_other_units_do_not_count(self, unit: Unit, person: Person, condominium: Condominium) -> None:
        self.owner(unit, person, "100", date(2024, 1, 1)).save()
        other_unit = Unit.objects.create(condominium=condominium, name="202")

        self.owner(other_unit, self.other_person("B"), "100", date(2024, 1, 1)).clean()

    def test_api_answers_400_on_the_field(self, unit: Unit, person: Person) -> None:
        self.owner(unit, person, "80", date(2024, 1, 1)).save()
        serializer = UnitPersonSerializer(
            data={
                "unit": unit.pk, "person": self.other_person("B").pk, "role": "owner",
                "ownership_percentage": "30", "start_date": "2024-06-01",
            }
        )

        assert not serializer.is_valid()
        assert "ownership_percentage" in serializer.errors
