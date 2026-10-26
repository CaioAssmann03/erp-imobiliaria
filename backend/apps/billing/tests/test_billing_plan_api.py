"""Billing plans API: nested items, replace, filters, scoping, admin and audit (spec 024, R4, R5, R7)."""

from typing import Any

import pytest
from auditlog.models import LogEntry
from django.contrib import admin
from django.test import RequestFactory
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.seed.documents import generate_cnpj
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.tests.base import body, error_codes, results

from ..models import BillingPlan, BillingPlanItem

pytestmark = pytest.mark.django_db

LIST = "billing-plan-list"
DETAIL = "billing-plan-detail"


def fixed_item(cost_center: CostCenter, entry_template: EntryTemplate, description: str = "Taxa condominial") -> dict[str, Any]:
    return {
        "description": description,
        "cost_center": str(cost_center.pk),
        "entry_template": str(entry_template.pk),
        "calculation_kind": "fixed_amount",
        "amount": "450.00",
        "apportionment_criterion": None,
        "unit_value_field": None,
    }


def plan_payload(condominium: Condominium, items: list[dict[str, Any]], name: str = "Ordinária") -> dict[str, Any]:
    return {
        "condominium": str(condominium.pk),
        "name": name,
        "active": True,
        "start_month": None,
        "end_month": None,
        "items": items,
    }


# ----- R4: nested write -----


def test_create_with_items_keeps_their_order(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    gas = {
        **fixed_item(cost_center, entry_template, "Gás"),
        "calculation_kind": "unit_registered_value",
        "amount": None,
        "unit_value_field": "gas",
    }
    share = {
        **fixed_item(cost_center, entry_template, "Rateio de obras"),
        "calculation_kind": "ideal_fraction_share",
        "amount": "9000.00",
        "apportionment_criterion": str(condominium.apportionment_criteria.get(position=1).pk),
    }

    response = api_client.post(
        reverse(LIST), plan_payload(condominium, [fixed_item(cost_center, entry_template), gas, share]), format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    created = body(response)
    assert created["condominium_name"] == "Residencial Sol"
    assert [(item["position"], item["description"]) for item in created["items"]] == [
        (0, "Taxa condominial"),
        (1, "Gás"),
        (2, "Rateio de obras"),
    ]
    assert created["items"][0]["cost_center_name"] == "Taxa Ordinária"
    assert created["items"][0]["entry_template_name"] == "REC Taxa Ordinária"


def test_a_plan_needs_at_least_one_item(api_client: APIClient, condominium: Condominium) -> None:
    without_items = api_client.post(reverse(LIST), plan_payload(condominium, []), format="json")

    assert without_items.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(without_items, "items.non_field_errors") == ["empty"]


def test_item_error_names_its_position_and_nothing_is_saved(
    api_client: APIClient,
    condominium: Condominium,
    other_condominium: Condominium,
    cost_center: CostCenter,
    entry_template: EntryTemplate,
) -> None:
    foreign_cost_center = CostCenter.objects.create(condominium=other_condominium, name="Taxa")
    foreign_template = EntryTemplate.objects.create(cost_center=foreign_cost_center, name="REC")
    items = [fixed_item(cost_center, entry_template), fixed_item(foreign_cost_center, foreign_template)]

    response = api_client.post(reverse(LIST), plan_payload(condominium, items), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "items.1.cost_center") == ["billing_plan_item.cost_center.other_condominium"]
    assert not BillingPlan.objects.exists()


def test_item_kind_error_is_reported_on_the_item(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    item = {**fixed_item(cost_center, entry_template), "amount": None}

    response = api_client.post(reverse(LIST), plan_payload(condominium, [item]), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "items.0.amount") == ["billing_plan_item.amount.does_not_match_kind"]


def test_sending_items_replaces_the_list_and_patch_without_items_keeps_it(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    created = body(
        api_client.post(
            reverse(LIST),
            plan_payload(condominium, [fixed_item(cost_center, entry_template, "A"), fixed_item(cost_center, entry_template, "B")]),
            format="json",
        )
    )
    detail = reverse(DETAIL, args=[created["id"]])

    replaced = api_client.put(
        detail, plan_payload(condominium, [fixed_item(cost_center, entry_template, "C")]), format="json"
    )
    renamed = api_client.patch(detail, {"name": "Ordinária 2026"}, format="json")

    assert replaced.status_code == status.HTTP_200_OK, replaced.data
    assert [item["description"] for item in body(replaced)["items"]] == ["C"]
    assert renamed.status_code == status.HTTP_200_OK, renamed.data
    assert [item["description"] for item in body(renamed)["items"]] == ["C"]
    assert BillingPlanItem.objects.count() == 1


def test_duplicate_name_is_a_400(
    api_client: APIClient, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    _ = BillingPlan.objects.create(condominium=condominium, name="Ordinária")

    response = api_client.post(reverse(LIST), plan_payload(condominium, [fixed_item(cost_center, entry_template)]), format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_plan.name.duplicate_in_condominium" in [item["code"] for item in body(response)["errors"]]


# ----- R5: list, filters, delete, scoping -----


def test_filters_search_and_delete(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium, plan: BillingPlan, build_item
) -> None:
    build_item().save()
    _ = BillingPlan.objects.create(condominium=condominium, name="Fundo de Obras", active=False)
    _ = BillingPlan.objects.create(condominium=other_condominium, name="Ordinária")

    by_condominium = results(api_client.get(reverse(LIST), {"condominium": str(condominium.pk)}))
    inactive = results(api_client.get(reverse(LIST), {"active": "false"}))
    searched = results(api_client.get(reverse(LIST), {"query": "obras"}))
    deleted = api_client.delete(reverse(DETAIL, args=[plan.pk]))

    assert {item["name"] for item in by_condominium} == {"Ordinária", "Fundo de Obras"}
    assert [item["name"] for item in inactive] == ["Fundo de Obras"]
    assert [item["name"] for item in searched] == ["Fundo de Obras"]
    assert deleted.status_code == status.HTTP_204_NO_CONTENT
    assert not BillingPlanItem.objects.exists()


def test_other_company_cannot_see_or_use_the_records(
    other_api_client: APIClient, condominium: Condominium, plan: BillingPlan, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    hidden = other_api_client.get(reverse(DETAIL, args=[plan.pk]))
    created = other_api_client.post(
        reverse(LIST), plan_payload(condominium, [fixed_item(cost_center, entry_template)]), format="json"
    )

    assert hidden.status_code == status.HTTP_404_NOT_FOUND
    assert created.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(created, "condominium") == ["does_not_exist"]


# ----- R7: admin and audit -----


def test_admin_is_company_scoped(company: Company, other_company: Company, plan: BillingPlan) -> None:
    staff = User.objects.create_user("staff", password="x", company=company, is_staff=True)
    their_condominium = Condominium.objects.create(company=other_company, name="Alheio", cnpj=generate_cnpj(7))
    _ = BillingPlan.objects.create(condominium=their_condominium, name="Alheio")
    request = RequestFactory().get("/admin/")
    request.user = staff

    plans = admin.site._registry[BillingPlan].get_queryset(request)

    assert list(plans) == [plan]


def test_plans_and_items_are_audited(
    api_client: APIClient, company: Company, condominium: Condominium, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    _ = api_client.post(reverse(LIST), plan_payload(condominium, [fixed_item(cost_center, entry_template)]), format="json")

    assert LogEntry.objects.get_for_model(BillingPlan).count() == 1
    assert LogEntry.objects.get_for_model(BillingPlanItem).count() == 1
