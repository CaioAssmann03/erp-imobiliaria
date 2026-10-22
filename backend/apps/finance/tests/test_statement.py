"""The statement: balance by cost center, unit on an entry, batch info and the competence filter (spec 017)."""

import datetime
from decimal import Decimal
from typing import Any, cast

import pytest
from django.core.exceptions import ValidationError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, Unit

from ..models import CostCenter, CurrentAccount, CurrentAccountEntry, EntryTemplate
from ..services.post_entry import post_entry
from ..services.reverse_entry import reverse_entry
from .base import body, results

pytestmark = pytest.mark.django_db


@pytest.fixture
def unit(condominium: Condominium) -> Unit:
    return Unit.objects.create(condominium=condominium, name="101", ideal_fraction=Decimal("0.1"))


@pytest.fixture
def second_cost_center(condominium: Condominium) -> CostCenter:
    return CostCenter.objects.create(condominium=condominium, name="Fundo de Obras")


@pytest.fixture
def second_template(second_cost_center: CostCenter) -> EntryTemplate:
    return EntryTemplate.objects.create(cost_center=second_cost_center, name="OBRAS")


# ----- balance by cost center -----


def test_the_queryset_sums_credits_minus_debits(make_entry: Any) -> None:
    post_entry(make_entry(kind="credit", amount=Decimal("500.00")))
    post_entry(make_entry(kind="debit", amount=Decimal("120.50")))

    assert CurrentAccountEntry.objects.signed_total() == Decimal("379.50")
    assert CurrentAccountEntry.objects.none().signed_total() == Decimal(0)


def test_balances_are_split_by_cost_center(
    make_entry: Any, current_account: CurrentAccount, cost_center: CostCenter,
    second_cost_center: CostCenter, second_template: EntryTemplate,
) -> None:
    post_entry(make_entry(kind="credit", amount=Decimal("100.00")))
    post_entry(make_entry(kind="debit", amount=Decimal("30.00")))
    post_entry(make_entry(kind="credit", amount=Decimal("40.00"), cost_center=second_cost_center, entry_template=second_template))

    balances = cast(
        dict[str, Decimal],
        {row["cost_center_name"]: row["balance"] for row in current_account.balances_by_cost_center()},
    )

    assert balances == {"Fundo de Reserva": Decimal("70.00"), "Fundo de Obras": Decimal("40.00")}
    assert sum(balances.values()) == current_account.recalculated_balance()


def test_the_balances_endpoint_answers_the_total_and_each_cost_center(
    api_client: APIClient, make_entry: Any, current_account: CurrentAccount,
    second_cost_center: CostCenter, second_template: EntryTemplate,
) -> None:
    post_entry(make_entry(kind="credit", amount=Decimal("100.00")))
    post_entry(make_entry(kind="debit", amount=Decimal("30.00"), cost_center=second_cost_center, entry_template=second_template))

    response = api_client.get(reverse("current-account-balances", args=[current_account.pk]))

    assert response.status_code == status.HTTP_200_OK, response.data
    assert body(response)["balance"] == "70.00"
    rows = {row["cost_center_name"]: row["balance"] for row in body(response)["cost_centers"]}
    assert rows == {"Fundo de Reserva": "100.00", "Fundo de Obras": "-30.00"}


def test_an_account_without_entries_has_no_balances(api_client: APIClient, current_account: CurrentAccount) -> None:
    response = api_client.get(reverse("current-account-balances", args=[current_account.pk]))

    assert body(response) == {"balance": "0.00", "cost_centers": []}


def test_another_company_does_not_see_the_balances(other_api_client: APIClient, current_account: CurrentAccount) -> None:
    response = other_api_client.get(reverse("current-account-balances", args=[current_account.pk]))

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ----- unit on an entry -----


def test_an_entry_may_point_at_a_unit_of_the_condominium(make_entry: Any, unit: Unit) -> None:
    entry = make_entry(unit=unit)

    entry.full_clean()


def test_a_unit_of_another_condominium_is_rejected(make_entry: Any, other_condominium: Condominium) -> None:
    other_unit = Unit.objects.create(condominium=other_condominium, name="9", ideal_fraction=Decimal("0.1"))

    with pytest.raises(ValidationError) as error:
        make_entry(unit=other_unit).full_clean()

    assert error.value.error_dict["unit"][0].code == "current_account_entry.unit.other_condominium"


def test_the_reversal_keeps_the_unit(make_entry: Any, unit: Unit) -> None:
    original = post_entry(make_entry(unit=unit))

    assert original.created_by is not None
    reversal = reverse_entry(original, "Posted by mistake", datetime.date(2026, 10, 7), original.created_by)

    assert reversal.unit == unit


def test_the_statement_carries_the_unit_and_the_batch(api_client: APIClient, make_entry: Any, unit: Unit) -> None:
    post_entry(make_entry(unit=unit))

    row = results(api_client.get(reverse("current-account-entry-list")))[0]

    assert str(row["unit"]) == str(unit.pk)
    assert row["unit_name"] == "101"
    assert row["batch_origin"] == "bank"
    assert row["batch_date"] == "2026-10-06"


def test_the_statement_filters_by_unit_and_by_competence_month(
    api_client: APIClient, make_entry: Any, unit: Unit
) -> None:
    with_unit = post_entry(make_entry(unit=unit, competence_month=datetime.date(2026, 9, 1)))
    _ = post_entry(make_entry(competence_month=datetime.date(2026, 10, 1)))

    by_unit = results(api_client.get(reverse("current-account-entry-list"), {"unit": str(unit.pk)}))
    by_month = results(api_client.get(reverse("current-account-entry-list"), {"competence_month": "2026-09-01"}))

    assert [row["id"] for row in by_unit] == [str(with_unit.pk)]
    assert [row["id"] for row in by_month] == [str(with_unit.pk)]
