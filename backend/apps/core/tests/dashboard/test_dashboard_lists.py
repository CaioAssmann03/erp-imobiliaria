"""The two lists behind the dashboard's "ver" cards are paginated endpoints (spec 068)."""

from datetime import timedelta
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, CondominiumAdministrationContract
from apps.core.models import Company

from ..base import body, results

pytestmark = pytest.mark.django_db

today = timezone.localdate


def valid_cnpj(seed: int) -> str:
    """A CNPJ with correct check digits, for a test that needs many condominiums."""
    digits = [int(char) for char in f"{seed:08d}0001"]
    for weights in ([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]):
        total = sum(digit * weight for digit, weight in zip(digits, weights))
        digits.append(0 if total % 11 < 2 else 11 - total % 11)
    return "".join(str(digit) for digit in digits)


def make_contract(company: Company, seed: int, **fields: object) -> CondominiumAdministrationContract:
    condominium = Condominium.objects.create(company=company, name=f"Condominio {seed:02d}", cnpj=valid_cnpj(seed))
    return CondominiumAdministrationContract.objects.create(condominium=condominium, **fields)


def test_adjustments_come_by_date_ten_to_a_page(api_client: APIClient, company: Company) -> None:
    for seed in range(1, 13):
        _ = make_contract(
            company,
            seed,
            fee_amount=Decimal(1),
            adjustment_period_months=12,
            adjustment_base_date=today() + timedelta(days=seed) - timedelta(days=365),
        )

    first = body(api_client.get(reverse("dashboard-adjustments"), {"limit": 10}))
    second = results(api_client.get(reverse("dashboard-adjustments"), {"limit": 10, "page": 2}))

    assert first["count"] == 12  # type: ignore[index]
    assert len(first["results"]) == 10  # type: ignore[index,arg-type]
    assert [item["name"] for item in second] == ["Condominio 11", "Condominio 12"]


def test_largest_fees_come_largest_first_ten_to_a_page(api_client: APIClient, company: Company) -> None:
    for seed in range(1, 13):
        _ = make_contract(company, seed, fee_type="fixed", fee_amount=Decimal(100 * seed))

    first = results(api_client.get(reverse("dashboard-largest-fees"), {"limit": 10}))
    second = results(api_client.get(reverse("dashboard-largest-fees"), {"limit": 10, "page": 2}))

    assert [item["name"] for item in first][:2] == ["Condominio 12", "Condominio 11"]
    assert len(first) == 10
    assert [item["name"] for item in second] == ["Condominio 02", "Condominio 01"]


def test_both_lists_stay_inside_the_company(api_client: APIClient, other_company: Company) -> None:
    _ = make_contract(other_company, 1, fee_type="fixed", fee_amount=Decimal(900))

    assert results(api_client.get(reverse("dashboard-largest-fees"))) == []
    assert results(api_client.get(reverse("dashboard-adjustments"))) == []
