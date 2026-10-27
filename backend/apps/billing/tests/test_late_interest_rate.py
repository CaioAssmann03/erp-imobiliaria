"""Late interest rates: a history by start date per condominium (spec 020, R6 to R9)."""

from datetime import date
from decimal import Decimal

import pytest
from auditlog.models import LogEntry
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.finance.tests.base import body, error_codes, results

from ..models import LateInterestRate

pytestmark = pytest.mark.django_db

LIST = "late-interest-rate-list"
DETAIL = "late-interest-rate-detail"


def make_rate(condominium: Condominium, start_date: date, percentage: str = "1.00") -> LateInterestRate:
    return LateInterestRate.objects.create(
        condominium=condominium, start_date=start_date, monthly_percentage=Decimal(percentage)
    )


def payload(condominium: Condominium, **overrides: object) -> dict[str, object]:
    return {
        "condominium": str(condominium.pk),
        "start_date": "2026-01-01",
        "monthly_percentage": "1.00",
        **overrides,
    }


def test_crud_flow(api_client: APIClient, condominium: Condominium) -> None:
    created = api_client.post(reverse(LIST), payload(condominium), format="json")
    assert created.status_code == status.HTTP_201_CREATED, created.data
    url = reverse(DETAIL, args=[body(created)["id"]])

    assert api_client.get(url).status_code == status.HTTP_200_OK
    updated = api_client.patch(url, {"monthly_percentage": "0.50"}, format="json")
    assert updated.status_code == status.HTTP_200_OK, updated.data
    assert body(updated)["monthly_percentage"] == "0.50"
    assert api_client.delete(url).status_code == status.HTTP_204_NO_CONTENT
    assert not LateInterestRate.objects.exists()


def test_list_is_filtered_by_condominium_and_newest_start_first(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    other = Condominium.objects.create(company=company, name="Outro", cnpj="45723174000110")
    _ = make_rate(condominium, date(2025, 1, 1))
    _ = make_rate(condominium, date(2026, 1, 1))
    _ = make_rate(other, date(2026, 3, 1))

    response = api_client.get(reverse(LIST), {"condominium": str(condominium.pk)})

    assert [item["start_date"] for item in results(response)] == ["2026-01-01", "2025-01-01"]


def test_another_companys_data_is_not_reachable(
    other_api_client: APIClient, condominium: Condominium
) -> None:
    rate = make_rate(condominium, date(2026, 1, 1))

    assert body(other_api_client.get(reverse(LIST)))["count"] == 0
    assert other_api_client.get(reverse(DETAIL, args=[rate.pk])).status_code == status.HTTP_404_NOT_FOUND
    created = other_api_client.post(reverse(LIST), payload(condominium), format="json")
    assert created.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(created, "condominium") == ["does_not_exist"]


def test_duplicate_start_date_is_rejected_with_its_code(
    api_client: APIClient, condominium: Condominium
) -> None:
    _ = make_rate(condominium, date(2026, 1, 1))

    response = api_client.post(reverse(LIST), payload(condominium, monthly_percentage="2.00"), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["late_interest_rate.start_date.duplicate_in_condominium"]


def test_the_same_start_date_is_allowed_in_another_condominium(
    api_client: APIClient, company: Company, condominium: Condominium
) -> None:
    other = Condominium.objects.create(company=company, name="Outro", cnpj="45723174000110")
    _ = make_rate(other, date(2026, 1, 1))

    response = api_client.post(reverse(LIST), payload(condominium), format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data


@pytest.mark.parametrize("percentage", ["-1", "100.01"])
def test_percentage_out_of_range_is_rejected(
    api_client: APIClient, condominium: Condominium, percentage: str
) -> None:
    response = api_client.post(reverse(LIST), payload(condominium, monthly_percentage=percentage), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "monthly_percentage") == ["percentage.out_of_range"]


def test_database_rejects_a_duplicate_start_date(condominium: Condominium) -> None:
    _ = make_rate(condominium, date(2026, 1, 1))

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = make_rate(condominium, date(2026, 1, 1), "2.00")


def test_database_rejects_a_percentage_above_100(condominium: Condominium) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        _ = make_rate(condominium, date(2026, 1, 1), "100.01")


def test_in_force_on_picks_the_latest_start_not_after_the_date(condominium: Condominium) -> None:
    first = make_rate(condominium, date(2025, 1, 1), "1.00")
    second = make_rate(condominium, date(2026, 6, 1), "0.50")
    rates = LateInterestRate.objects.filter(condominium=condominium)

    assert rates.in_force_on(date(2024, 12, 31)) is None
    assert rates.in_force_on(date(2025, 1, 1)) == first
    assert rates.in_force_on(date(2026, 5, 31)) == first
    assert rates.in_force_on(date(2026, 6, 1)) == second
    assert rates.in_force_on(date(2030, 1, 1)) == second


def test_in_force_on_is_available_from_the_condominium(condominium: Condominium) -> None:
    rate = make_rate(condominium, date(2025, 1, 1))

    assert condominium.late_interest_rates.in_force_on(date(2026, 1, 1)) == rate


def test_deleting_the_condominium_deletes_its_rates(condominium: Condominium) -> None:
    _ = make_rate(condominium, date(2026, 1, 1))

    condominium.delete()

    assert not LateInterestRate.objects.exists()


def test_changes_are_audited(jwt_api_client: APIClient, condominium: Condominium) -> None:
    rate = make_rate(condominium, date(2026, 1, 1), "1.00")

    _ = jwt_api_client.patch(reverse(DETAIL, args=[rate.pk]), {"monthly_percentage": "0.50"}, format="json")

    entry = LogEntry.objects.get_for_object(rate).order_by("timestamp").last()
    assert entry is not None
    assert entry.changes["monthly_percentage"] == ["1.00", "0.50"]
    assert entry.actor is not None
