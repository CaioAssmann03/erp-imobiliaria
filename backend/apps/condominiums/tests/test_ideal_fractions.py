"""Up to six ideal fractions per unit, each closing at 1 over the active units (spec 020, R10 to R13)."""

from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from ..models import Condominium, Unit
from ..serializers import UnitSerializer
from .base import body

pytestmark = pytest.mark.django_db

FRACTION_FIELDS = Unit.IDEAL_FRACTION_FIELDS


def apportionment_url(condominium: Condominium) -> str:
    return reverse("condominium-apportionment", args=[condominium.pk])


def test_a_unit_has_six_fractions_named_from_the_first() -> None:
    assert FRACTION_FIELDS == (
        "ideal_fraction",
        "ideal_fraction_2",
        "ideal_fraction_3",
        "ideal_fraction_4",
        "ideal_fraction_5",
        "ideal_fraction_6",
    )


@pytest.mark.parametrize("field", FRACTION_FIELDS)
def test_each_fraction_accepts_a_value_in_range(condominium: Condominium, field: str) -> None:
    serializer = UnitSerializer(data={"condominium": condominium.pk, "name": "101", field: "0.5"})

    assert serializer.is_valid(), serializer.errors


@pytest.mark.parametrize("field", FRACTION_FIELDS)
@pytest.mark.parametrize("value", ["0", "-0.1", "1.1"])
def test_each_fraction_rejects_a_value_out_of_range(
    condominium: Condominium, field: str, value: str
) -> None:
    serializer = UnitSerializer(data={"condominium": condominium.pk, "name": "101", field: value})

    assert not serializer.is_valid()
    assert serializer.errors[field][0].code == "unit.ideal_fraction.out_of_range"


@pytest.mark.parametrize("field", FRACTION_FIELDS)
def test_database_rejects_a_fraction_out_of_range(condominium: Condominium, field: str) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = Unit.objects.create(condominium=condominium, name="101", **{field: Decimal("1.5")})


@pytest.mark.parametrize("field", FRACTION_FIELDS)
def test_the_sum_of_each_fraction_cannot_exceed_one(condominium: Condominium, field: str) -> None:
    _ = Unit.objects.create(condominium=condominium, name="1", **{field: Decimal("0.6")})
    serializer = UnitSerializer(data={"condominium": condominium.pk, "name": "2", field: "0.5"})

    assert not serializer.is_valid()
    assert serializer.errors[field][0].code == "unit.ideal_fraction.sum_exceeds_total"


def test_each_fraction_is_summed_on_its_own(condominium: Condominium) -> None:
    _ = Unit.objects.create(
        condominium=condominium, name="1", ideal_fraction=Decimal("0.6"), ideal_fraction_2=Decimal("0.9")
    )

    fits = UnitSerializer(
        data={"condominium": condominium.pk, "name": "2", "ideal_fraction": "0.4", "ideal_fraction_2": "0.1"}
    )
    too_much_in_the_first = UnitSerializer(
        data={"condominium": condominium.pk, "name": "3", "ideal_fraction": "0.5", "ideal_fraction_2": "0.1"}
    )

    assert fits.is_valid(), fits.errors
    assert not too_much_in_the_first.is_valid()
    assert set(too_much_in_the_first.errors) == {"ideal_fraction"}


@pytest.mark.parametrize("field", FRACTION_FIELDS)
def test_inactive_units_do_not_count(condominium: Condominium, field: str) -> None:
    _ = Unit.objects.create(condominium=condominium, name="1", active=False, **{field: Decimal("0.9")})

    Unit(condominium=condominium, name="2", **{field: Decimal("0.9")}).clean()


@pytest.mark.parametrize("field", FRACTION_FIELDS)
def test_updating_a_unit_does_not_count_itself(condominium: Condominium, field: str) -> None:
    unit = Unit.objects.create(condominium=condominium, name="1", **{field: Decimal("0.9")})

    setattr(unit, field, Decimal("1"))
    unit.clean()


@pytest.mark.parametrize("field", FRACTION_FIELDS[1:])
def test_other_fractions_do_not_block_a_unit_without_that_fraction(
    condominium: Condominium, field: str
) -> None:
    _ = Unit.objects.create(condominium=condominium, name="1", **{field: Decimal("1")})

    with pytest.raises(ValidationError) as error:
        Unit(condominium=condominium, name="2", **{field: Decimal("0.1")}).clean()
    Unit(condominium=condominium, name="3").clean()

    assert set(error.value.message_dict) == {field}


def test_apportionment_endpoint_reports_totals_and_inconsistency(
    api_client: APIClient, condominium: Condominium
) -> None:
    _ = Unit.objects.create(
        condominium=condominium, name="1", ideal_fraction=Decimal("0.6"), ideal_fraction_2=Decimal("0.3")
    )
    _ = Unit.objects.create(condominium=condominium, name="2", ideal_fraction=Decimal("0.4"))
    _ = Unit.objects.create(condominium=condominium, name="3", ideal_fraction=Decimal("0.9"), active=False)

    response = api_client.get(apportionment_url(condominium))

    assert response.status_code == status.HTTP_200_OK, response.data
    data = body(response)
    assert data["active_units"] == 2
    assert [(item["number"], item["total"], item["is_inconsistent"]) for item in data["fractions"]] == [
        (1, "1.00000000", False),
        (2, "0.30000000", True),
        (3, "0.00000000", False),
        (4, "0.00000000", False),
        (5, "0.00000000", False),
        (6, "0.00000000", False),
    ]


def test_apportionment_endpoint_flags_nothing_without_active_units(
    api_client: APIClient, condominium: Condominium
) -> None:
    data = body(api_client.get(apportionment_url(condominium)))

    assert data["active_units"] == 0
    assert not any(item["is_inconsistent"] for item in data["fractions"])


def test_apportionment_endpoint_is_company_scoped(
    other_api_client: APIClient, condominium: Condominium
) -> None:
    response = other_api_client.get(apportionment_url(condominium))

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_a_fraction_in_use_closes_at_one_only_when_it_sums_one() -> None:
    assert not Unit.is_apportionment_inconsistent(1, Decimal("1"))
    assert not Unit.is_apportionment_inconsistent(1, Decimal("0.99995"))  # inside the tolerance
    assert Unit.is_apportionment_inconsistent(1, Decimal("0"))  # the 1st is always required
    assert Unit.is_apportionment_inconsistent(1, Decimal("0.9"))
    assert not Unit.is_apportionment_inconsistent(3, Decimal("0"))  # the 3rd is not in use
    assert Unit.is_apportionment_inconsistent(3, Decimal("0.4"))
