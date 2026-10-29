"""The extra boleto: a standalone billing document outside the monthly issuance (spec 054, R1–R6, R8)."""

from datetime import timedelta
from decimal import Decimal
from typing import Any

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium, Unit
from apps.core.models import Company
from apps.finance.models import CostCenter, EntryTemplate
from apps.finance.tests.base import body, errors
from apps.persons.models import PeopleIndividual

from ..models import BillingDocument, BillingEvent, BillingRun, GatewayAccount
from ..services.issue_condominium_billing import issue_condominium_billing

pytestmark = pytest.mark.django_db

EXTRA = "billing-document-extra"
DOCUMENTS = "billing-document-list"
Problem = BillingRun.ProblemCode

CPF = "52998224725"
TODAY = timezone.localdate()
DUE_DATE = TODAY + timedelta(days=10)
COMPETENCE_MONTH = TODAY.replace(day=1)


@pytest.fixture
def fee_event(company: Company) -> BillingEvent:
    return BillingEvent.objects.create(company=company, code=5, name="TARIFA BANCO", credits_company=True)


@pytest.fixture
def units(make_unit, link) -> list[Unit]:  # type: ignore[no-untyped-def]
    made = [make_unit(name, fraction=fraction) for name, fraction in (("101", "0.2"), ("102", "0.3"), ("103", "0.5"))]
    for unit in made:
        link(unit, f"Dono {unit.name}")
    return made


def line(center: CostCenter, **overrides: Any) -> dict[str, Any]:
    return {"description": "Reparo do portão", "allocation": "collective", "cost_center": str(center.pk), "amount": "300.00", **overrides}


def payload(condominium: Condominium, units: list[Unit], lines: list[dict[str, Any]], **overrides: Any) -> dict[str, Any]:
    return {
        "condominium": str(condominium.pk),
        "due_date": DUE_DATE.isoformat(),
        "competence_month": COMPETENCE_MONTH.isoformat(),
        "units": [str(unit.pk) for unit in units],
        "lines": lines,
        **overrides,
    }


def post(api_client: APIClient, data: dict[str, Any]):  # type: ignore[no-untyped-def]
    return api_client.post(reverse(EXTRA), data, format="json")


# ----- R1, R2: the request and the documents -----


def test_each_unit_gets_an_extra_with_its_share_of_the_lines(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    lines = [line(cost_center), line(cost_center, description="Multa", allocation="individual", amount="25.00")]

    response = post(api_client, payload(condominium, units, lines))

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert body(response)["skipped"] == []
    documents = BillingDocument.objects.order_by("unit__name")
    assert [(d.unit.name, d.kind, d.amount) for d in documents] == [
        ("101", "extra", Decimal("125.00")),
        ("102", "extra", Decimal("125.00")),
        ("103", "extra", Decimal("125.00")),
    ]
    first = documents[0]
    assert [(item.description, item.amount) for item in first.items.all()] == [
        ("Reparo do portão", Decimal("100.00")),
        ("Multa", Decimal("25.00")),
    ]
    assert (first.reference_month, first.competence_month, first.due_date) == (COMPETENCE_MONTH, COMPETENCE_MONTH, DUE_DATE)
    assert first.late_fee_percentage == billing_rules.late_fee_percentage


def test_a_fraction_line_splits_by_the_criterion(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    criterion = condominium.apportionment_criteria.get()

    response = post(
        api_client,
        payload(condominium, units, [line(cost_center, allocation="fraction", apportionment_criterion=str(criterion.pk))]),
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    amounts = {d.unit.name: d.amount for d in BillingDocument.objects.all()}
    assert amounts == {"101": Decimal("60.00"), "102": Decimal("90.00"), "103": Decimal("150.00")}


def test_the_registration_fee_line_credits_the_company(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template, fee_event
) -> None:
    fee = {"event": str(fee_event.pk), "allocation": "individual", "amount": "3.90"}

    response = post(api_client, payload(condominium, units[:1], [line(cost_center, amount="100.00"), fee]))

    assert response.status_code == status.HTTP_201_CREATED, response.data
    document = BillingDocument.objects.get()
    assert document.fee_amount() == Decimal("3.90")
    assert [(item.description, item.credits_company) for item in document.items.all()] == [
        ("Reparo do portão", False),
        ("0005-TARIFA BANCO", True),
    ]


def test_an_extra_coexists_with_the_monthly_document_of_the_same_month(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template, make_plan_item
) -> None:
    _ = make_plan_item()
    _ = issue_condominium_billing(condominium, COMPETENCE_MONTH)

    first = post(api_client, payload(condominium, units[:1], [line(cost_center)]))
    second = post(api_client, payload(condominium, units[:1], [line(cost_center)]))

    assert first.status_code == second.status_code == status.HTTP_201_CREATED
    unit_documents = BillingDocument.objects.filter(unit=units[0])
    assert sorted(unit_documents.values_list("kind", flat=True)) == ["extra", "extra", "monthly"]


def test_an_extra_does_not_count_as_the_monthly_document_when_the_month_is_issued(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template, make_plan_item
) -> None:
    _ = post(api_client, payload(condominium, units, [line(cost_center)]))
    _ = make_plan_item()

    run = issue_condominium_billing(condominium, COMPETENCE_MONTH)

    assert (run.issued_count, run.already_issued_count) == (3, 0)


def test_the_extra_is_scheduled_for_its_pdf_and_registration(  # type: ignore[no-untyped-def]
    api_client: APIClient,
    condominium,
    billing_rules,
    units,
    cost_center,
    entry_template,
    monkeypatch: pytest.MonkeyPatch,
    django_capture_on_commit_callbacks,
) -> None:
    sent: list[str] = []
    monkeypatch.setattr(
        "apps.billing.services.schedule_billing_document_tasks.celery_app.send_task",
        lambda name, args: sent.append(name),
    )
    _ = GatewayAccount.objects.create(
        company=condominium.company, api_key="k", webhook_token="t", status=GatewayAccount.Status.ACTIVE
    )
    _ = PeopleIndividual.objects.create(person=units[0].unit_people.get().person, company=condominium.company, cpf=CPF)

    with django_capture_on_commit_callbacks(execute=True):
        response = post(api_client, payload(condominium, units[:1], [line(cost_center)]))

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert sent == ["apps.billing.tasks.generate_billing_document_pdf_task", "apps.billing.tasks.register_billing_document_task"]


def test_with_an_active_gateway_account_a_payer_without_tax_id_is_skipped(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    _ = GatewayAccount.objects.create(
        company=condominium.company, api_key="k", webhook_token="t", status=GatewayAccount.Status.ACTIVE
    )

    response = post(api_client, payload(condominium, units[:1], [line(cost_center)]))

    assert response.status_code == status.HTTP_200_OK
    assert [item["code"] for item in body(response)["skipped"]] == [Problem.PAYER_WITHOUT_DOCUMENT]


# ----- R3: the lines are validated like launches -----


def test_a_line_needs_a_sub_conta_unless_its_event_credits_the_company(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template, fee_event
) -> None:
    missing = post(api_client, payload(condominium, units, [line(cost_center, cost_center=None)]))
    with_both = post(api_client, payload(condominium, units, [line(cost_center, event=str(fee_event.pk))]))

    assert missing.status_code == with_both.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_entry.cost_center.required" in str(missing.data)
    assert "billing_entry.cost_center.not_allowed_for_company_event" in str(with_both.data)
    assert not BillingDocument.objects.exists()


def test_a_fraction_line_needs_a_criterion_of_the_condominium(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    response = post(api_client, payload(condominium, units, [line(cost_center, allocation="fraction")]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_entry.apportionment_criterion.does_not_match_allocation" in str(response.data)


def test_the_errors_point_at_the_line_that_failed(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    response = post(api_client, payload(condominium, units, [line(cost_center), line(cost_center, cost_center=None)]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert [(item["field"], item["code"]) for item in errors(response)] == [
        ("lines.1.cost_center", "billing_entry.cost_center.required")
    ]


# ----- R4: units that cannot be issued -----


def test_units_that_cannot_be_issued_are_skipped_and_told(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, make_unit, link, cost_center, entry_template
) -> None:
    ok, no_payer, blocked, inactive = make_unit("101"), make_unit("102"), make_unit("103", is_billing_blocked=True), make_unit("104", active=False)
    for unit in (ok, blocked, inactive):
        link(unit, f"Dono {unit.name}")

    response = post(api_client, payload(condominium, [ok, no_payer, blocked, inactive], [line(cost_center)]))

    assert response.status_code == status.HTTP_201_CREATED
    assert list(BillingDocument.objects.values_list("unit__name", "amount")) == [("101", Decimal("300.00"))]
    assert {(item["unit_name"], item["code"]) for item in body(response)["skipped"]} == {
        ("102", Problem.NO_CURRENT_PAYER),
        ("103", Problem.UNIT_BILLING_BLOCKED),
        ("104", Problem.UNIT_BILLING_BLOCKED),
    }


def test_when_no_unit_can_be_issued_the_answer_is_200_with_the_reasons(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, make_unit, cost_center, entry_template
) -> None:
    unit = make_unit("101")

    response = post(api_client, payload(condominium, [unit], [line(cost_center)]))

    assert response.status_code == status.HTTP_200_OK
    assert body(response)["issued"] == []
    assert [item["code"] for item in body(response)["skipped"]] == [Problem.NO_CURRENT_PAYER]


def test_a_fraction_line_leaves_out_a_unit_with_no_fraction(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, make_unit, link, cost_center, entry_template
) -> None:
    without_fraction = make_unit("104")
    link(without_fraction, "Sem fração")
    criterion = condominium.apportionment_criteria.get()

    response = post(
        api_client,
        payload(
            condominium,
            [*units, without_fraction],
            [line(cost_center, allocation="fraction", apportionment_criterion=str(criterion.pk))],
        ),
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert [item["code"] for item in body(response)["skipped"]] == [Problem.NOTHING_TO_BILL]


# ----- R6: kind -----


def test_documents_carry_their_kind_and_filter_by_it(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template, make_plan_item
) -> None:
    _ = make_plan_item()
    _ = issue_condominium_billing(condominium, COMPETENCE_MONTH)
    _ = post(api_client, payload(condominium, units[:1], [line(cost_center)]))

    extras = api_client.get(reverse(DOCUMENTS), {"kind": "extra"})

    assert [item["kind"] for item in extras.data["results"]] == ["extra"]
    assert api_client.get(reverse(DOCUMENTS), {"kind": "monthly"}).data["count"] == 3


# ----- R8: validation and scoping -----


def test_the_data_is_validated_and_nothing_is_created_when_invalid(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    no_units = post(api_client, payload(condominium, [], [line(cost_center)]))
    no_lines = post(api_client, payload(condominium, units, []))
    not_first_day = post(api_client, payload(condominium, units, [line(cost_center)], competence_month=TODAY.replace(day=5).isoformat()))

    assert {no_units.status_code, no_lines.status_code, not_first_day.status_code} == {status.HTTP_400_BAD_REQUEST}
    assert not BillingDocument.objects.exists()


def test_a_due_date_in_the_past_is_refused_without_creating_documents(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    yesterday = (TODAY - timedelta(days=1)).isoformat()

    response = post(api_client, payload(condominium, units, [line(cost_center)], due_date=yesterday))

    assert response.status_code == status.HTTP_200_OK
    assert {item["code"] for item in body(response)["skipped"]} == {Problem.DOCUMENT_INVALID}
    assert not BillingDocument.objects.exists()


def test_a_unit_of_another_condominium_is_refused(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, other_condominium, billing_rules, units, cost_center, entry_template
) -> None:
    stranger = Unit.objects.create(condominium=other_condominium, name="901")

    response = post(api_client, payload(condominium, [*units, stranger], [line(cost_center)]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_document.units.other_condominium" in str(response.data)


def test_a_condominium_without_billing_rules_is_refused(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium, units, cost_center, entry_template
) -> None:
    response = post(api_client, payload(condominium, units, [line(cost_center)]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "billing_document.condominium.without_billing_rules" in str(response.data)


def test_another_companys_condominium_is_refused(  # type: ignore[no-untyped-def]
    other_api_client: APIClient, condominium, billing_rules, units, cost_center, entry_template
) -> None:
    response = post(other_api_client, payload(condominium, units, [line(cost_center)]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert not BillingDocument.objects.exists()
