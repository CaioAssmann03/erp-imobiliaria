"""Entry batch (roadmap phase 3 part 04, no spec yet): the cash number matches the origin."""

import datetime

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from apps.core.models import Company

from ..models import EntryBatch

pytestmark = pytest.mark.django_db

TODAY = datetime.date(2026, 10, 6)


def make_batch(company: Company, origin: str, cash_number: int | None) -> EntryBatch:
    return EntryBatch(company=company, batch_date=TODAY, origin=origin, cash_number=cash_number)


def error_codes(batch: EntryBatch) -> list[str | None]:
    with pytest.raises(ValidationError) as error:
        batch.full_clean()
    return [item.code for item in error.value.error_dict["cash_number"]]


@pytest.mark.parametrize("origin", ["cash", "extra_cash"])
def test_cash_origins_accept_a_cash_number(company: Company, origin: str) -> None:
    batch = make_batch(company, origin, 3)

    batch.full_clean()
    batch.save()


@pytest.mark.parametrize("origin", ["cash", "extra_cash"])
def test_cash_origins_require_a_cash_number(company: Company, origin: str) -> None:
    assert error_codes(make_batch(company, origin, None)) == ["entry_batch.cash_number.required"]


def test_bank_origin_accepts_no_cash_number(company: Company) -> None:
    make_batch(company, "bank", None).full_clean()


def test_bank_origin_refuses_a_cash_number(company: Company) -> None:
    assert error_codes(make_batch(company, "bank", 3)) == ["entry_batch.cash_number.not_allowed"]


def test_cash_number_must_be_greater_than_zero(company: Company) -> None:
    assert error_codes(make_batch(company, "cash", 0)) == ["cash_number.not_positive"]


@pytest.mark.parametrize(("origin", "cash_number"), [("cash", None), ("extra_cash", None), ("bank", 3)])
def test_the_database_refuses_a_cash_number_that_does_not_match_the_origin(
    company: Company, origin: str, cash_number: int | None
) -> None:
    with pytest.raises(IntegrityError), transaction.atomic():
        make_batch(company, origin, cash_number).save()


def test_origin_is_required(company: Company) -> None:
    with pytest.raises(ValidationError) as error:
        make_batch(company, "", None).full_clean()

    assert "origin" in error.value.error_dict
