"""Entry batch number (spec 073, R2 and R3): one number per batch, unique in the company, and a date that never changes."""

import datetime

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import Company

from ..models import EntryBatch
from .base import body, errors, results

pytestmark = pytest.mark.django_db

DAY = datetime.date(2026, 10, 6)
BATCHES = "entry-batch-list"
BATCH_DETAIL = "entry-batch-detail"


def make_batch(company: Company, number: int | None = None, batch_date: datetime.date = DAY) -> EntryBatch:
    batch = EntryBatch(company=company, batch_date=batch_date, origin="bank")
    if number is not None:
        batch.number = number
    batch.full_clean()
    batch.save()
    return batch


def validation_codes(batch: EntryBatch) -> set[str | None]:
    with pytest.raises(ValidationError) as error:
        batch.full_clean()
    return {item.code for items in error.value.error_dict.values() for item in items}


def codes(response: object) -> set[str | None]:
    return {item["code"] for item in errors(response)}  # type: ignore[arg-type]


# ----- the number -----


def test_the_number_is_the_next_free_one_when_it_is_left_out(company: Company, other_company: Company) -> None:
    first = make_batch(company)
    second = make_batch(company)
    elsewhere = make_batch(other_company)

    assert (first.number, second.number, elsewhere.number) == (1, 2, 1)


def test_a_typed_number_is_kept_and_the_next_one_follows_the_highest(company: Company) -> None:
    assert make_batch(company, number=40).number == 40

    assert make_batch(company).number == 41


def test_the_number_is_unique_in_the_company(company: Company) -> None:
    _ = make_batch(company, number=7)

    assert "entry_batch.number.duplicate_in_company" in validation_codes(
        EntryBatch(company=company, number=7, batch_date=DAY, origin="bank")
    )


def test_the_database_refuses_a_repeated_number(company: Company) -> None:
    _ = make_batch(company, number=7)

    with pytest.raises(IntegrityError), transaction.atomic():
        _ = EntryBatch.objects.create(company=company, number=7, batch_date=DAY, origin="bank")


def test_another_company_can_use_the_same_number(company: Company, other_company: Company) -> None:
    _ = make_batch(company, number=7)

    assert make_batch(other_company, number=7).number == 7


@pytest.mark.parametrize("number", [0, -3])
def test_the_number_must_be_greater_than_zero(company: Company, number: int) -> None:
    assert "entry_batch.number.not_positive" in validation_codes(
        EntryBatch(company=company, number=number, batch_date=DAY, origin="bank")
    )


def test_the_number_of_a_saved_batch_never_changes(company: Company) -> None:
    batch = make_batch(company, number=7)
    batch.number = 8

    assert validation_codes(batch) == {"entry_batch.number.immutable"}


# ----- the date -----


def test_the_date_of_a_batch_never_changes(company: Company) -> None:
    batch = make_batch(company)
    batch.batch_date = DAY + datetime.timedelta(days=1)

    assert validation_codes(batch) == {"entry_batch.batch_date.immutable"}


def test_a_batch_that_changes_nothing_stays_valid(company: Company) -> None:
    batch = make_batch(company, number=7)
    batch.cash_number = None

    batch.full_clean()


# ----- the API -----


def test_a_batch_is_created_with_the_typed_number(api_client: APIClient) -> None:
    response = api_client.post(reverse(BATCHES), {"number": 150, "batch_date": "2026-10-06", "origin": "bank"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert body(response)["number"] == 150


def test_a_batch_created_without_a_number_takes_the_next_free_one(api_client: APIClient, company: Company) -> None:
    _ = make_batch(company, number=9)

    response = api_client.post(reverse(BATCHES), {"batch_date": "2026-10-06", "origin": "bank"}, format="json")

    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert body(response)["number"] == 10


def test_a_repeated_number_is_a_400_with_its_code(api_client: APIClient, company: Company) -> None:
    _ = make_batch(company, number=7)

    response = api_client.post(reverse(BATCHES), {"number": 7, "batch_date": "2026-10-07", "origin": "bank"}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "entry_batch.number.duplicate_in_company" in codes(response)


def test_the_number_and_the_date_do_not_change_through_the_api(api_client: APIClient, company: Company) -> None:
    batch = make_batch(company, number=7)
    detail = reverse(BATCH_DETAIL, args=[str(batch.pk)])

    number_change = api_client.patch(detail, {"number": 8}, format="json")
    date_change = api_client.patch(detail, {"batch_date": "2026-10-07"}, format="json")

    assert number_change.status_code == status.HTTP_400_BAD_REQUEST
    assert "entry_batch.number.immutable" in codes(number_change)
    assert date_change.status_code == status.HTTP_400_BAD_REQUEST
    assert "entry_batch.batch_date.immutable" in codes(date_change)


def test_a_batch_is_found_by_its_number(api_client: APIClient, company: Company) -> None:
    wanted = make_batch(company, number=7)
    _ = make_batch(company, number=8)

    rows = results(api_client.get(reverse(BATCHES), {"number": 7}))

    assert [row["id"] for row in rows] == [str(wanted.pk)]
    assert rows[0]["number"] == 7


def test_the_number_of_another_company_is_not_found(api_client: APIClient, other_company: Company) -> None:
    _ = make_batch(other_company, number=7)

    assert results(api_client.get(reverse(BATCHES), {"number": 7})) == []
