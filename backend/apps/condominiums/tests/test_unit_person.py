from datetime import date, timedelta
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.core.testing import seeded_company
from apps.persons.models import Person
from apps.persons.services.release_person_to_module import release_person_to_module
from apps.persons.services.remove_person_from_module import remove_person_from_module

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


    def test_tenant_cannot_have_percentage(self) -> None:
        errors = clean_errors(link(role="tenant", ownership_percentage=Decimal(10)))

        assert "ownership_percentage" in errors


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
    return condominium_person("Maria")


def condominium_person(name: str) -> Person:
    created = Person.objects.create(company=seeded_company(), name=name)
    release_person_to_module(created, "condominiums")
    return created


@pytest.mark.django_db
class TestUnitPersonConstraints:


    def test_only_one_active_link_per_role(self, unit: Unit, person: Person) -> None:
        _ = UnitPerson.objects.create(
            unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1)
        )

        with pytest.raises(IntegrityError), transaction.atomic():
            _ = UnitPerson.objects.create(
                unit=unit, person=person, role="tenant", start_date=date(2025, 2, 1)
            )


@pytest.mark.django_db
class TestOwnersCap:
    """At no date may the owners of a unit sum more than 100%."""

    def owner(self, unit: Unit, person: Person, pct: str, start: date, end: date | None = None) -> UnitPerson:
        return UnitPerson(
            unit=unit, person=person, role="owner", ownership_percentage=Decimal(pct),
            start_date=start, end_date=end,
        )

    def other_person(self, name: str) -> Person:
        return condominium_person(name)

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


@pytest.mark.django_db
class TestPersonModuleRule:
    """A person is linked to a unit only if they belong to the condominiums module (spec 019, R9)."""

    @pytest.fixture
    def rentals_person(self) -> Person:
        created = Person.objects.create(company=seeded_company(), name="Locadora")
        release_person_to_module(created, "rentals")
        return created

    def tenant_link(self, unit: Unit, person: Person) -> UnitPerson:
        return UnitPerson(unit=unit, person=person, role="tenant", start_date=date(2025, 1, 1))


    def test_the_api_answers_400_with_the_module_code(
        self, unit: Unit, rentals_person: Person
    ) -> None:
        serializer = UnitPersonSerializer(
            data={
                "unit": unit.pk,
                "person": rentals_person.pk,
                "role": "tenant",
                "start_date": "2025-01-01",
            }
        )

        assert not serializer.is_valid()
        assert [error.code for error in serializer.errors["person"]] == [
            "unit_person.person.not_in_condominiums"
        ]


    def test_changing_a_link_to_a_rentals_only_person_is_refused(
        self, unit: Unit, person: Person, rentals_person: Person
    ) -> None:
        link = self.tenant_link(unit, person)
        link.save()

        link.person = rentals_person

        assert "person" in clean_errors(link)

    def test_a_person_who_leaves_condominiums_keeps_the_links(
        self, unit: Unit, person: Person
    ) -> None:
        link = self.tenant_link(unit, person)
        link.save()
        remove_person_from_module(person, "condominiums")

        link.refresh_from_db()
        serializer = UnitPersonSerializer(link, data={"end_date": "2025-06-01"}, partial=True)

        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestIsCurrent:
    """`is_current` is the server's answer to "does this link still hold today?" (no end date, or ending today or later)."""

    def test_a_link_without_end_date_is_current(self) -> None:
        assert link(role="tenant").is_current(date(2025, 6, 1))

    def test_a_link_ending_on_the_day_is_still_current(self) -> None:
        assert link(role="tenant", end_date=date(2025, 6, 1)).is_current(date(2025, 6, 1))

    def test_a_link_that_ended_before_the_day_is_not(self) -> None:
        assert not link(role="tenant", end_date=date(2025, 5, 31)).is_current(date(2025, 6, 1))

    def test_the_unit_payload_tells_which_links_are_current(self, api_client: APIClient, unit: Unit, person: Person) -> None:
        today = timezone.localdate()
        _ = UnitPerson.objects.create(unit=unit, person=person, role="tenant", start_date=today - timedelta(days=90), end_date=today)
        _ = UnitPerson.objects.create(unit=unit, person=person, role="owner", ownership_percentage=100, start_date=today - timedelta(days=90))
        gone = condominium_person("Foi embora")
        _ = UnitPerson.objects.create(unit=unit, person=gone, role="tenant", start_date=today - timedelta(days=90), end_date=today - timedelta(days=1))

        payload = api_client.get(reverse("unit-detail", args=[unit.pk])).json()

        current_by_person = {(link["person_detail"]["name"], link["role"]): link["is_current"] for link in payload["unit_people"]}
        assert current_by_person == {("Maria", "tenant"): True, ("Maria", "owner"): True, ("Foi embora", "tenant"): False}
