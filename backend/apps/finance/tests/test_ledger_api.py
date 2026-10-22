"""Ledger API: current accounts, entry batches and the statement (spec 014, R8-R12)."""

from decimal import Decimal
from typing import Any

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.condominiums.models import Condominium
from apps.core.models import Company

from ..models import (
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
    EntryTemplate,
)
from ..services.post_entry import post_entry
from .base import body, error_codes, results

pytestmark = pytest.mark.django_db

ACCOUNTS = "current-account-list"
BATCHES = "entry-batch-list"
BATCH_DETAIL = "entry-batch-detail"
ENTRIES = "current-account-entry-list"
ENTRY_DETAIL = "current-account-entry-detail"
REVERSE = "current-account-entry-reverse"


def entry_payload(current_account: Any, batch: Any, entry_template: Any, cost_center: Any, **extra: object) -> dict[str, object]:
    return {
        "current_account": str(current_account.pk),
        "batch": str(batch.pk),
        "entry_template": str(entry_template.pk),
        "cost_center": str(cost_center.pk),
        "entry_date": "2026-10-06",
        "competence_month": "2026-10-01",
        "kind": "credit",
        "amount": "250.00",
        "description": "Taxa de outubro",
        "justification": "Manual adjustment",
        **extra,
    }


# ----- current accounts -----


def test_a_current_account_is_created_with_a_zero_balance(api_client: APIClient, condominium: Condominium, company: Company) -> None:
    response = api_client.post(reverse(ACCOUNTS), {"condominium": str(condominium.pk), "balance": "999.00"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert body(response)["balance"] == "0.00"
    assert str(body(response)["company"]) == str(company.pk)


def test_a_condominium_has_one_current_account_only(api_client: APIClient, condominium: Condominium, current_account: CurrentAccount) -> None:
    response = api_client.post(reverse(ACCOUNTS), {"condominium": str(condominium.pk)}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "current_account.condominium.duplicate" in [item["code"] for item in body(response)["errors"]]


def test_current_accounts_are_listed_and_filtered_by_condominium(
    api_client: APIClient, current_account: CurrentAccount, company: Company, other_condominium: Condominium
) -> None:
    _ = CurrentAccount.objects.create(company=company, condominium=other_condominium)

    everything = api_client.get(reverse(ACCOUNTS))
    filtered = api_client.get(reverse(ACCOUNTS), {"condominium": str(current_account.condominium_id)})

    assert len(results(everything)) == 2
    assert [row["id"] for row in results(filtered)] == [str(current_account.pk)]


def test_a_current_account_is_not_deleted_nor_changed_through_the_api(api_client: APIClient, current_account: CurrentAccount) -> None:
    detail = reverse("current-account-detail", args=[current_account.pk])

    assert api_client.delete(detail).status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert api_client.patch(detail, {"condominium": None}, format="json").status_code == status.HTTP_405_METHOD_NOT_ALLOWED


def test_another_company_does_not_see_the_account(other_api_client: APIClient, current_account: CurrentAccount) -> None:
    assert results(other_api_client.get(reverse(ACCOUNTS))) == []
    assert other_api_client.get(reverse("current-account-detail", args=[current_account.pk])).status_code == status.HTTP_404_NOT_FOUND


def test_a_current_account_with_entries_cannot_be_deleted(make_entry: Any, current_account: CurrentAccount) -> None:
    post_entry(make_entry())

    with pytest.raises(ValidationError) as error:
        current_account.delete()

    assert error.value.code == "current_account.deletion.has_entries"


# ----- entry batches -----


def test_a_batch_is_created_listed_and_updated(api_client: APIClient, company: Company) -> None:
    created = api_client.post(reverse(BATCHES), {"batch_date": "2026-10-06", "origin": "cash", "cash_number": 3}, format="json")
    assert created.status_code == status.HTTP_201_CREATED, created.data
    assert str(body(created)["company"]) == str(company.pk)
    detail = reverse(BATCH_DETAIL, args=[str(body(created)["id"])])

    patched = api_client.patch(detail, {"cash_number": 4}, format="json")

    assert patched.status_code == status.HTTP_200_OK
    assert body(patched)["cash_number"] == 4
    assert len(results(api_client.get(reverse(BATCHES), {"origin": "cash"}))) == 1


def test_a_batch_answers_a_coded_error_for_a_cash_number_that_does_not_match_the_origin(api_client: APIClient) -> None:
    response = api_client.post(reverse(BATCHES), {"batch_date": "2026-10-06", "origin": "bank", "cash_number": 3}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "cash_number") == ["entry_batch.cash_number.not_allowed"]


def test_a_batch_is_not_deleted_through_the_api(api_client: APIClient, entry_batch: EntryBatch) -> None:
    assert api_client.delete(reverse(BATCH_DETAIL, args=[entry_batch.pk])).status_code == status.HTTP_405_METHOD_NOT_ALLOWED


def test_a_batch_with_entries_cannot_be_deleted(make_entry: Any, entry_batch: EntryBatch) -> None:
    post_entry(make_entry())

    with pytest.raises(ValidationError) as error:
        entry_batch.delete()

    assert error.value.code == "entry_batch.deletion.has_entries"


# ----- entries (the statement) -----


def test_a_manual_entry_is_posted_through_the_api(
    api_client: APIClient, current_account: CurrentAccount, entry_batch: EntryBatch, entry_template: EntryTemplate,
    cost_center: CostCenter, staff_user: User, company: Company,
) -> None:
    response = api_client.post(
        reverse(ENTRIES), entry_payload(current_account, entry_batch, entry_template, cost_center), format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    data = body(response)
    assert data["origin"] == "manual"
    assert str(data["created_by"]) == str(staff_user.pk)
    assert str(data["company"]) == str(company.pk)
    assert data["registry"] is not None
    current_account.refresh_from_db()
    assert current_account.balance == Decimal("250.00")


def test_the_client_cannot_set_the_registry_the_origin_nor_the_user(
    api_client: APIClient, current_account: CurrentAccount, entry_batch: EntryBatch, entry_template: EntryTemplate,
    cost_center: CostCenter, staff_user: User,
) -> None:
    payload = entry_payload(current_account, entry_batch, entry_template, cost_center, registry=1, origin="automatic_payable", created_by=None)

    response = api_client.post(reverse(ENTRIES), payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert body(response)["origin"] == "manual"
    assert str(body(response)["created_by"]) == str(staff_user.pk)
    assert body(response)["registry"] != 1


@pytest.mark.parametrize(
    ("overrides", "field", "code"),
    [
        ({"amount": "0"}, "amount", "amount.not_positive"),
        ({"competence_month": "2026-10-15"}, "competence_month", "current_account_entry.competence_month.not_first_day"),
        ({"justification": ""}, "justification", "current_account_entry.justification.blank"),
        ({"justification": "   "}, "justification", "current_account_entry.justification.blank"),
    ],
)
def test_an_invalid_manual_entry_answers_a_coded_error_and_does_not_move_the_balance(
    api_client: APIClient, current_account: CurrentAccount, entry_batch: EntryBatch, entry_template: EntryTemplate,
    cost_center: CostCenter, overrides: dict[str, object], field: str, code: str,
) -> None:
    response = api_client.post(
        reverse(ENTRIES), entry_payload(current_account, entry_batch, entry_template, cost_center, **overrides), format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert code in error_codes(response, field)
    current_account.refresh_from_db()
    assert current_account.balance == Decimal(0)
    assert not CurrentAccountEntry.objects.exists()


def test_an_entry_is_never_changed_nor_deleted_through_the_api(api_client: APIClient, make_entry: Any) -> None:
    entry = post_entry(make_entry())
    detail = reverse(ENTRY_DETAIL, args=[entry.pk])

    assert api_client.patch(detail, {"amount": "1.00"}, format="json").status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert api_client.put(detail, {}, format="json").status_code == status.HTTP_405_METHOD_NOT_ALLOWED
    assert api_client.delete(detail).status_code == status.HTTP_405_METHOD_NOT_ALLOWED


def test_the_statement_lists_the_newest_first_and_is_filtered(
    api_client: APIClient, make_entry: Any, current_account: CurrentAccount, other_condominium: Condominium, company: Company
) -> None:
    first = post_entry(make_entry(kind="credit", amount=Decimal("10.00"), entry_date="2026-10-01"))
    second = post_entry(make_entry(kind="debit", amount=Decimal("3.00"), entry_date="2026-10-05"))
    _ = CurrentAccount.objects.create(company=company, condominium=other_condominium)

    everything = results(api_client.get(reverse(ENTRIES)))
    debits = results(api_client.get(reverse(ENTRIES), {"kind": "debit"}))
    by_condominium = results(api_client.get(reverse(ENTRIES), {"condominium": str(current_account.condominium_id)}))
    by_date = results(api_client.get(reverse(ENTRIES), {"entry_date_after": "2026-10-03"}))
    by_other = results(api_client.get(reverse(ENTRIES), {"condominium": str(other_condominium.pk)}))

    assert [row["id"] for row in everything] == [str(second.pk), str(first.pk)]
    assert [row["id"] for row in debits] == [str(second.pk)]
    assert len(by_condominium) == 2
    assert [row["id"] for row in by_date] == [str(second.pk)]
    assert by_other == []


def test_another_company_does_not_see_the_entries(other_api_client: APIClient, make_entry: Any) -> None:
    entry = post_entry(make_entry())

    assert results(other_api_client.get(reverse(ENTRIES))) == []
    assert other_api_client.get(reverse(ENTRY_DETAIL, args=[entry.pk])).status_code == status.HTTP_404_NOT_FOUND


def test_another_company_cannot_post_into_the_account(
    other_api_client: APIClient, current_account: CurrentAccount, entry_batch: EntryBatch, entry_template: EntryTemplate,
    cost_center: CostCenter,
) -> None:
    response = other_api_client.post(
        reverse(ENTRIES), entry_payload(current_account, entry_batch, entry_template, cost_center), format="json"
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    current_account.refresh_from_db()
    assert current_account.balance == Decimal(0)


def test_the_reverse_action_posts_the_opposite_entry(api_client: APIClient, make_entry: Any, current_account: CurrentAccount) -> None:
    original = post_entry(make_entry(kind="debit", amount=Decimal("100.00")))

    response = api_client.post(
        reverse(REVERSE, args=[original.pk]), {"reason": "Posted by mistake", "reversal_date": "2026-10-07"}, format="json"
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert body(response)["kind"] == "credit"
    assert str(body(response)["reversal_of"]) == str(original.pk)
    current_account.refresh_from_db()
    assert current_account.balance == Decimal("0.00")


def test_the_reverse_action_refuses_a_second_reversal_with_a_code(api_client: APIClient, make_entry: Any) -> None:
    original = post_entry(make_entry())
    data = {"reason": "Posted by mistake", "reversal_date": "2026-10-07"}
    assert api_client.post(reverse(REVERSE, args=[original.pk]), data, format="json").status_code == status.HTTP_201_CREATED

    again = api_client.post(reverse(REVERSE, args=[original.pk]), data, format="json")

    assert again.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(again, "reversal_of") == ["current_account_entry.reversal_of.already_reversed"]


def test_the_reverse_action_needs_a_reason(api_client: APIClient, make_entry: Any) -> None:
    original = post_entry(make_entry())

    response = api_client.post(reverse(REVERSE, args=[original.pk]), {"reversal_date": "2026-10-07"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_another_company_cannot_reverse_the_entry(other_api_client: APIClient, make_entry: Any) -> None:
    original = post_entry(make_entry())

    response = other_api_client.post(
        reverse(REVERSE, args=[original.pk]), {"reason": "x", "reversal_date": "2026-10-07"}, format="json"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


# ----- origin constraints of the entry -----


def test_an_automatic_entry_needs_its_account_payable(make_entry: Any) -> None:
    entry = make_entry(origin="automatic_payable", justification="")

    with pytest.raises(ValidationError) as error:
        entry.full_clean()

    assert error.value.error_dict["account_payable"][0].code == "current_account_entry.account_payable.mismatch_origin"


def test_a_manual_entry_has_no_account_payable(make_entry: Any, make_account: Any) -> None:
    entry = make_entry(account_payable=make_account())

    with pytest.raises(ValidationError) as error:
        entry.full_clean()

    assert error.value.error_dict["account_payable"][0].code == "current_account_entry.account_payable.mismatch_origin"


def test_the_database_refuses_an_automatic_entry_without_account_payable(make_entry: Any) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        make_entry(origin="automatic_payable", justification="").save()


def test_the_database_refuses_a_manual_entry_without_justification(make_entry: Any) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        make_entry(justification="").save()


def test_an_account_payable_has_one_ledger_entry_only(make_entry: Any, make_account: Any, staff_user: User) -> None:
    import datetime

    from ..services.settle_account_payable import (
        AccountPayablePayment,
        settle_account_payable,
    )

    paid = settle_account_payable(
        make_account(), AccountPayablePayment(datetime.date(2026, 10, 18), Decimal("1250.00"), "pix", staff_user)
    )

    with pytest.raises(ValidationError) as error:
        post_entry(
            make_entry(
                origin="automatic_payable",
                justification="",
                account_payable=paid,
                kind="debit",
            )
        )

    assert error.value.error_dict["account_payable"][0].code == "current_account_entry.account_payable.already_posted"


# ----- Admin -----


def test_the_admin_shows_the_entries_read_only() -> None:
    from django.contrib import admin

    model_admin = admin.site._registry[CurrentAccountEntry]

    assert not model_admin.has_add_permission(None)  # type: ignore[arg-type]
    assert not model_admin.has_change_permission(None)  # type: ignore[arg-type]
    assert not model_admin.has_delete_permission(None)  # type: ignore[arg-type]


# ----- a batch of entries over several condominiums -----

BATCH_ENTRIES = "entry-batch-post-entries"


def line(current_account: Any, entry_template: Any, cost_center: Any, **extra: object) -> dict[str, object]:
    return {
        "current_account": str(current_account.pk),
        "entry_template": str(entry_template.pk),
        "cost_center": str(cost_center.pk),
        "entry_date": "2026-10-06",
        "competence_month": "2026-10-01",
        "kind": "debit",
        "amount": "40.00",
        "description": "Tarifa bancária",
        "justification": "Bank fee",
        **extra,
    }


@pytest.fixture
def second_condominium_setup(company: Company, other_condominium: Condominium) -> tuple[CurrentAccount, CostCenter, EntryTemplate]:
    account = CurrentAccount.objects.create(company=company, condominium=other_condominium)
    center = CostCenter.objects.create(condominium=other_condominium, name="Normal")
    template = EntryTemplate.objects.create(cost_center=center, name="TARIFA")
    return account, center, template


def test_a_batch_posts_entries_of_several_condominiums(
    api_client: APIClient, entry_batch: EntryBatch, current_account: CurrentAccount, entry_template: EntryTemplate,
    cost_center: CostCenter, second_condominium_setup: tuple[CurrentAccount, CostCenter, EntryTemplate],
) -> None:
    other_account, other_center, other_template = second_condominium_setup
    payload = {
        "entries": [
            line(current_account, entry_template, cost_center, amount="40.00"),
            line(other_account, other_template, other_center, kind="credit", amount="15.50"),
        ]
    }

    response = api_client.post(reverse(BATCH_ENTRIES, args=[entry_batch.pk]), payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert len(response.data) == 2
    assert {str(item["batch"]) for item in response.data} == {str(entry_batch.pk)}
    assert all(item["origin"] == "manual" for item in response.data)
    current_account.refresh_from_db()
    other_account.refresh_from_db()
    assert current_account.balance == Decimal("-40.00")
    assert other_account.balance == Decimal("15.50")


def test_a_batch_with_an_invalid_line_saves_nothing_and_says_which_line(
    api_client: APIClient, entry_batch: EntryBatch, current_account: CurrentAccount, entry_template: EntryTemplate,
    cost_center: CostCenter,
) -> None:
    payload = {
        "entries": [
            line(current_account, entry_template, cost_center),
            line(current_account, entry_template, cost_center, competence_month="2026-10-15"),
        ]
    }

    response = api_client.post(reverse(BATCH_ENTRIES, args=[entry_batch.pk]), payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert any(
        item["field"] == "entries.1.competence_month"
        and item["code"] == "current_account_entry.competence_month.not_first_day"
        for item in body(response)["errors"]
    ), body(response)
    assert not CurrentAccountEntry.objects.exists()
    current_account.refresh_from_db()
    assert current_account.balance == Decimal(0)


def test_a_batch_needs_at_least_one_entry(api_client: APIClient, entry_batch: EntryBatch) -> None:
    response = api_client.post(reverse(BATCH_ENTRIES, args=[entry_batch.pk]), {"entries": []}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_another_company_cannot_post_into_the_batch(
    other_api_client: APIClient, entry_batch: EntryBatch, current_account: CurrentAccount, entry_template: EntryTemplate,
    cost_center: CostCenter,
) -> None:
    response = other_api_client.post(
        reverse(BATCH_ENTRIES, args=[entry_batch.pk]), {"entries": [line(current_account, entry_template, cost_center)]}, format="json"
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_the_statement_carries_the_names(api_client: APIClient, make_entry: Any, current_account: CurrentAccount) -> None:
    post_entry(make_entry())

    row = results(api_client.get(reverse(ENTRIES)))[0]

    assert row["condominium_name"] == "Residencial Sol"
    assert row["entry_template_name"] == "PG CEEE"
    assert row["cost_center_name"] == "Fundo de Reserva"
    assert str(row["condominium"]) == str(current_account.condominium_id)


def test_the_statement_says_which_entries_were_reversed(api_client: APIClient, make_entry: Any) -> None:
    import datetime

    from ..services.reverse_entry import reverse_entry

    original = post_entry(make_entry(kind="debit"))
    untouched = post_entry(make_entry(kind="credit"))
    assert original.created_by is not None
    reversal = reverse_entry(original, "Posted by mistake", datetime.date(2026, 10, 7), original.created_by)

    rows = {row["id"]: row for row in results(api_client.get(reverse(ENTRIES)))}

    assert rows[str(original.pk)]["is_reversed"] is True
    assert rows[str(untouched.pk)]["is_reversed"] is False
    assert rows[str(reversal.pk)]["is_reversed"] is False
    assert str(rows[str(reversal.pk)]["reversal_of"]) == str(original.pk)
