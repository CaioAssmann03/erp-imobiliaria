"""A unit's fractions, one per apportionment criterion, each closing at 1 over the active units (spec 039)."""

import uuid
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.testing import seeded_company

from ..models import CondominiumApportionmentCriterion, Condominium, Unit, UnitApportionmentFraction
from .base import body

pytestmark = pytest.mark.django_db


@pytest.fixture
def main(condominium: Condominium) -> CondominiumApportionmentCriterion:
    return condominium.apportionment_criteria.get(position=CondominiumApportionmentCriterion.MAIN_POSITION)


def add_criterion(condominium: Condominium, position: int, name: str | None = None) -> CondominiumApportionmentCriterion:
    return CondominiumApportionmentCriterion.objects.create(
        condominium=condominium, position=position, name=name or f"Critério {position}"
    )


def add_unit(condominium: Condominium, name: str, active: bool = True) -> Unit:
    return Unit.objects.create(condominium=condominium, name=name, active=active)


def fraction(unit: Unit, criterion: CondominiumApportionmentCriterion, value: str) -> UnitApportionmentFraction:
    return UnitApportionmentFraction.objects.create(unit=unit, criterion=criterion, value=Decimal(value))


def apportionment_url(condominium: Condominium) -> str:
    return reverse("condominium-apportionment", args=[condominium.pk])


@pytest.mark.parametrize("value", ["0", "-0.1", "1.1"])
def test_a_value_out_of_range_is_refused(condominium: Condominium, main: CondominiumApportionmentCriterion, value: str) -> None:
    candidate = UnitApportionmentFraction(unit=add_unit(condominium, "101"), criterion=main, value=Decimal(value))

    with pytest.raises(ValidationError) as error:
        candidate.full_clean()

    assert error.value.error_dict["value"][0].code == "unit.ideal_fraction.out_of_range"


def test_the_criterion_must_belong_to_the_units_condominium(condominium: Condominium) -> None:
    other = Condominium.objects.create(company=seeded_company(), name="Outro", cnpj="45723174000110")
    other_criterion = other.apportionment_criteria.get(position=1)
    candidate = UnitApportionmentFraction(unit=add_unit(condominium, "101"), criterion=other_criterion, value=Decimal("0.5"))

    with pytest.raises(ValidationError) as error:
        candidate.full_clean()

    assert error.value.error_dict["criterion"][0].code == "unit_apportionment_fraction.criterion.other_condominium"


def test_the_sum_over_the_active_units_cannot_pass_one(condominium: Condominium, main: CondominiumApportionmentCriterion) -> None:
    _ = fraction(add_unit(condominium, "1"), main, "0.6")
    candidate = UnitApportionmentFraction(unit=add_unit(condominium, "2"), criterion=main, value=Decimal("0.5"))

    with pytest.raises(ValidationError) as error:
        candidate.full_clean()

    assert error.value.error_dict["value"][0].code == "unit.ideal_fraction.sum_exceeds_total"


def test_each_criterion_is_summed_on_its_own(condominium: Condominium, main: CondominiumApportionmentCriterion) -> None:
    elevator = add_criterion(condominium, 2, "Elevador")
    first = add_unit(condominium, "1")
    _ = fraction(first, main, "0.6")
    _ = fraction(first, elevator, "0.9")
    second = add_unit(condominium, "2")

    UnitApportionmentFraction(unit=second, criterion=main, value=Decimal("0.4")).full_clean()
    UnitApportionmentFraction(unit=second, criterion=elevator, value=Decimal("0.1")).full_clean()
    with pytest.raises(ValidationError) as error:
        UnitApportionmentFraction(unit=second, criterion=main, value=Decimal("0.5")).full_clean()
    assert set(error.value.error_dict) == {"value"}


def test_inactive_units_do_not_count(condominium: Condominium, main: CondominiumApportionmentCriterion) -> None:
    _ = fraction(add_unit(condominium, "1", active=False), main, "0.9")

    UnitApportionmentFraction(unit=add_unit(condominium, "2"), criterion=main, value=Decimal("0.9")).full_clean()


def test_a_fraction_does_not_count_itself_when_it_changes(condominium: Condominium, main: CondominiumApportionmentCriterion) -> None:
    saved = fraction(add_unit(condominium, "1"), main, "0.9")

    saved.value = Decimal(1)
    saved.full_clean()


def test_reactivating_a_unit_counts_its_fractions_again(condominium: Condominium, main: CondominiumApportionmentCriterion) -> None:
    sleeping = add_unit(condominium, "1", active=False)
    _ = fraction(sleeping, main, "0.9")
    _ = fraction(add_unit(condominium, "2"), main, "0.9")

    sleeping.active = True
    with pytest.raises(ValidationError) as error:
        sleeping.full_clean()

    assert error.value.error_dict["active"][0].code == "unit.ideal_fraction.sum_exceeds_total"


def test_the_main_criterion_closes_at_one_and_the_others_only_when_in_use(condominium: Condominium) -> None:
    main = condominium.apportionment_criteria.get(position=1)
    other = add_criterion(condominium, 2, "Elevador")

    assert not main.is_inconsistent(Decimal(1))
    assert not main.is_inconsistent(Decimal("0.99995"))  # inside the tolerance
    assert main.is_inconsistent(Decimal(0))  # the main one is always required
    assert main.is_inconsistent(Decimal("0.9"))
    assert not other.is_inconsistent(Decimal(0))  # not in use
    assert other.is_inconsistent(Decimal("0.4"))


def test_the_apportionment_endpoint_reports_each_criterion(
    api_client: APIClient, condominium: Condominium, main: CondominiumApportionmentCriterion
) -> None:
    elevator = add_criterion(condominium, 2, "Elevador")
    first, second = add_unit(condominium, "1"), add_unit(condominium, "2")
    _ = fraction(first, main, "0.6")
    _ = fraction(first, elevator, "0.3")
    _ = fraction(second, main, "0.4")
    _ = fraction(add_unit(condominium, "3", active=False), main, "0.9")

    response = api_client.get(apportionment_url(condominium))

    assert response.status_code == status.HTTP_200_OK, response.data
    data = body(response)
    assert data["active_units"] == 2
    assert [(item["name"], item["position"], item["total"], item["is_inconsistent"]) for item in data["criteria"]] == [
        ("Geral", 1, "1.00000000", False),
        ("Elevador", 2, "0.30000000", True),
    ]


def test_a_set_of_fractions_repeating_a_criterion_is_refused_with_its_code() -> None:
    first, second = uuid.uuid4(), uuid.uuid4()

    with pytest.raises(ValidationError) as error:
        UnitApportionmentFraction.validate_distinct_criteria([first, second, first])

    assert error.value.code == "unit_apportionment_fraction.criterion.duplicate"
    UnitApportionmentFraction.validate_distinct_criteria([first, second])
    UnitApportionmentFraction.validate_distinct_criteria([])
