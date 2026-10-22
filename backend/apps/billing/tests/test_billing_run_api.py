"""Billing runs API and the Celery tasks (spec 026, R8)."""

from datetime import date
from unittest import mock

import pytest
from auditlog.models import LogEntry
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import BillingRules, Condominium
from apps.finance.tests.base import body, error_codes, results

from .. import tasks
from ..models import BillingDocument, BillingRun

pytestmark = pytest.mark.django_db

LIST = "billing-run-list"
DETAIL = "billing-run-detail"


@pytest.fixture
def issuable(billing_rules: BillingRules, make_unit, link, make_plan_item) -> None:  # type: ignore[no-untyped-def]
    link(make_unit("101"), "Maria")
    _ = make_plan_item()


def test_creating_a_run_issues_the_month_now(api_client: APIClient, condominium: Condominium, issuable: None) -> None:
    response = api_client.post(reverse(LIST), {"condominium": str(condominium.pk), "reference_month": "2026-10-01"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    data = body(response)
    assert (data["status"], data["issued_count"], [p["code"] for p in data["problems"]]) == ("succeeded", 1, ["gateway_account_missing"])
    assert data["condominium_name"] == "Residencial Sol"
    assert BillingDocument.objects.count() == 1


def test_the_reference_month_must_be_a_first_day(api_client: APIClient, condominium: Condominium, issuable: None) -> None:
    response = api_client.post(reverse(LIST), {"condominium": str(condominium.pk), "reference_month": "2026-10-15"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "reference_month") == ["month.not_first_day"]
    assert not BillingRun.objects.exists()


def test_a_run_cannot_be_edited_or_deleted(api_client: APIClient, condominium: Condominium, issuable: None) -> None:
    run = BillingRun.objects.create(condominium=condominium, reference_month=date(2026, 10, 1))

    assert api_client.patch(reverse(DETAIL, args=[run.pk]), {"status": "failed"}, format="json").status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert api_client.delete(reverse(DETAIL, args=[run.pk])).status_code == status.HTTP_405_METHOD_NOT_ALLOWED


def test_list_filters_and_retrieve(api_client: APIClient, condominium: Condominium, other_condominium: Condominium) -> None:
    mine = BillingRun.objects.create(condominium=condominium, reference_month=date(2026, 10, 1), status=BillingRun.Status.FAILED)
    _ = BillingRun.objects.create(condominium=other_condominium, reference_month=date(2026, 11, 1))

    by_condominium = results(api_client.get(reverse(LIST), {"condominium": str(condominium.pk)}))
    by_status = results(api_client.get(reverse(LIST), {"status": "failed"}))
    by_month = results(api_client.get(reverse(LIST), {"reference_month": "2026-11-01"}))
    detail = api_client.get(reverse(DETAIL, args=[mine.pk]))

    assert [run["id"] for run in by_condominium] == [str(mine.pk)]
    assert [run["id"] for run in by_status] == [str(mine.pk)]
    assert len(by_month) == 1
    assert detail.status_code == status.HTTP_200_OK


def test_other_company_cannot_see_or_trigger_runs(other_api_client: APIClient, condominium: Condominium, issuable: None) -> None:
    run = BillingRun.objects.create(condominium=condominium, reference_month=date(2026, 10, 1))

    hidden = other_api_client.get(reverse(DETAIL, args=[run.pk]))
    created = other_api_client.post(reverse(LIST), {"condominium": str(condominium.pk), "reference_month": "2026-10-01"}, format="json")

    assert hidden.status_code == status.HTTP_404_NOT_FOUND
    assert created.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(created, "condominium") == ["does_not_exist"]
    assert not BillingDocument.objects.exists()


def test_runs_are_audited(api_client: APIClient, condominium: Condominium, issuable: None) -> None:
    _ = api_client.post(reverse(LIST), {"condominium": str(condominium.pk), "reference_month": "2026-10-01"}, format="json")

    assert LogEntry.objects.get_for_model(BillingRun).count() >= 1


def test_the_daily_task_enqueues_only_the_condominiums_of_the_day(
    condominium: Condominium, other_condominium: Condominium
) -> None:
    today = timezone.localdate()
    other_day = 1 if today.day != 1 else 2
    _ = BillingRules.objects.create(condominium=condominium, issuance_day=today.day)
    _ = BillingRules.objects.create(condominium=other_condominium, issuance_day=other_day)

    with mock.patch.object(tasks.issue_condominium_billing_task, "delay") as delay:
        enqueued = tasks.issue_due_billing()

    assert enqueued == 1
    delay.assert_called_once_with(str(condominium.pk), today.replace(day=1).isoformat())


def test_the_daily_task_skips_inactive_condominiums(condominium: Condominium) -> None:
    _ = BillingRules.objects.create(condominium=condominium, issuance_day=timezone.localdate().day)
    _ = Condominium.objects.filter(pk=condominium.pk).update(active=False)

    with mock.patch.object(tasks.issue_condominium_billing_task, "delay") as delay:
        assert tasks.issue_due_billing() == 0

    delay.assert_not_called()


def test_the_condominium_task_runs_the_issuance(condominium: Condominium, issuable: None) -> None:
    run_id = tasks.issue_condominium_billing_task(str(condominium.pk), "2026-10-01")

    assert BillingRun.objects.get(pk=run_id).issued_count == 1


def test_the_beat_schedule_runs_the_daily_task_at_six(settings) -> None:  # type: ignore[no-untyped-def]
    entry = settings.CELERY_BEAT_SCHEDULE["issue-due-billing"]

    assert entry["task"] == "apps.billing.tasks.issue_due_billing"
    assert (entry["schedule"].hour, entry["schedule"].minute) == ({6}, {0})


def test_a_runs_problems_carry_the_name_of_their_unit(  # type: ignore[no-untyped-def]
    api_client: APIClient, condominium: Condominium, billing_rules: BillingRules, make_unit, make_plan_item
) -> None:
    without_owner = make_unit("101")
    _ = make_plan_item()
    created = api_client.post(reverse(LIST), {"condominium": str(condominium.pk), "reference_month": "2026-10-01"}, format="json")

    problems = body(created)["problems"]
    listed = results(api_client.get(reverse(LIST)))[0]["problems"]

    assert problems == [
        {"unit": None, "unit_name": None, "code": "gateway_account_missing"},
        {"unit": str(without_owner.pk), "unit_name": "101", "code": "no_current_payer"},
    ]
    assert listed == problems


def test_a_whole_condominium_problem_has_no_unit_name(api_client: APIClient, condominium: Condominium, billing_rules: BillingRules) -> None:
    created = api_client.post(reverse(LIST), {"condominium": str(condominium.pk), "reference_month": "2026-10-01"}, format="json")

    assert body(created)["problems"] == [{"unit": None, "unit_name": None, "code": "no_plan_in_force"}]
