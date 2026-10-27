"""The condominium billing rules API: one set per condominium, scoping, error codes and audit (spec 041, R4)."""

import pytest
from auditlog.models import LogEntry
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.finance.tests.base import body, error_codes, results

from ..models import CondominiumBillingRules

pytestmark = pytest.mark.django_db

LIST = "condominium-billing-rules-list"
DETAIL = "condominium-billing-rules-detail"


def payload(condominium: Condominium, **overrides: object) -> dict[str, object]:
    return {"condominium": str(condominium.pk), "due_day": 10, **overrides}


def test_crud_flow(api_client: APIClient, condominium: Condominium) -> None:
    created = api_client.post(reverse(LIST), payload(condominium), format="json")
    assert created.status_code == status.HTTP_201_CREATED, created.data
    url = reverse(DETAIL, args=[body(created)["id"]])

    assert body(api_client.get(url))["due_day"] == 10
    updated = api_client.patch(url, {"due_day": 15, "issuance_day": 5}, format="json")
    assert updated.status_code == status.HTTP_200_OK, updated.data
    assert (body(updated)["due_day"], body(updated)["issuance_day"]) == (15, 5)
    assert api_client.delete(url).status_code == status.HTTP_204_NO_CONTENT
    assert not CondominiumBillingRules.objects.exists()


def test_the_response_carries_every_term_of_the_condominium(api_client: APIClient, condominium: Condominium) -> None:
    response = api_client.post(
        reverse(LIST),
        payload(
            condominium,
            due_month="following",
            competence_month="before_due",
            late_fee_percentage="2.00",
            initial_late_fee_percentage="1.00",
            initial_late_fee_days=5,
            interest_calculation="per_day",
            interest_grace_days=3,
            should_show_qr_code=True,
            should_show_fee_statement=True,
        ),
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert body(response)["due_month"] == "following"
    rules = CondominiumBillingRules.objects.get(condominium=condominium)
    assert (rules.due_month, rules.competence_month) == ("following", "before_due")
    assert (rules.interest_calculation, rules.interest_grace_days) == ("per_day", 3)
    assert rules.should_show_qr_code and rules.should_show_fee_statement


def test_list_is_filtered_by_condominium(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium
) -> None:
    _ = CondominiumBillingRules.objects.create(condominium=condominium)
    _ = CondominiumBillingRules.objects.create(condominium=other_condominium)

    response = api_client.get(reverse(LIST), {"condominium": str(condominium.pk)})

    assert [str(item["condominium"]) for item in results(response)] == [str(condominium.pk)]


def test_a_condominium_has_a_single_set_of_rules(api_client: APIClient, condominium: Condominium) -> None:
    _ = CondominiumBillingRules.objects.create(condominium=condominium)

    response = api_client.post(reverse(LIST), payload(condominium), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert CondominiumBillingRules.objects.count() == 1


def test_another_companys_data_is_not_reachable(other_api_client: APIClient, condominium: Condominium) -> None:
    rules = CondominiumBillingRules.objects.create(condominium=condominium)

    assert body(other_api_client.get(reverse(LIST)))["count"] == 0
    assert other_api_client.get(reverse(DETAIL, args=[rules.pk])).status_code == status.HTTP_404_NOT_FOUND
    created = other_api_client.post(reverse(LIST), payload(condominium), format="json")
    assert created.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(created, "condominium") == ["does_not_exist"]


def test_the_condominium_of_the_rules_cannot_change(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium
) -> None:
    rules = CondominiumBillingRules.objects.create(condominium=condominium)

    response = api_client.patch(
        reverse(DETAIL, args=[rules.pk]), {"condominium": str(other_condominium.pk)}, format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "condominium") == ["condominium_billing_rules.condominium.immutable"]


def test_a_value_out_of_range_comes_back_with_its_code(api_client: APIClient, condominium: Condominium) -> None:
    response = api_client.post(reverse(LIST), payload(condominium, due_day=31), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "due_day") == ["condominium_billing_rules.due_day.out_of_range"]


def test_the_late_fee_above_the_limit_comes_back_with_its_code(api_client: APIClient, condominium: Condominium) -> None:
    response = api_client.post(reverse(LIST), payload(condominium, late_fee_percentage="3.00"), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "late_fee_percentage") == ["condominium_billing_rules.late_fee_percentage.out_of_range"]


def test_patch_clears_the_first_days_tier_with_nulls(api_client: APIClient, condominium: Condominium) -> None:
    rules = CondominiumBillingRules.objects.create(
        condominium=condominium, initial_late_fee_percentage="1.00", initial_late_fee_days=5
    )

    response = api_client.patch(
        reverse(DETAIL, args=[rules.pk]),
        {"initial_late_fee_percentage": None, "initial_late_fee_days": None},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK, response.data
    rules.refresh_from_db()
    assert (rules.initial_late_fee_percentage, rules.initial_late_fee_days) == (None, None)


def test_changes_are_audited(jwt_api_client: APIClient, condominium: Condominium, company: Company) -> None:
    rules = CondominiumBillingRules.objects.create(condominium=condominium, due_day=10)

    _ = jwt_api_client.patch(reverse(DETAIL, args=[rules.pk]), {"due_day": 12}, format="json")

    entry = LogEntry.objects.get_for_object(rules).order_by("timestamp").last()
    assert entry is not None
    assert entry.changes["due_day"] == ["10", "12"]
    assert entry.actor is not None
