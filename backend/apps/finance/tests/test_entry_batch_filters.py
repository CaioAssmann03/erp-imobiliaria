"""The batch list filtered by condominium (spec 059): the batches that have an entry of it."""

from datetime import date

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.core.models import Company

from ..models import CostCenter, CurrentAccount, EntryBatch, EntryTemplate
from ..services.post_entry import post_entry
from .base import body

pytestmark = pytest.mark.django_db

LIST = "entry-batch-list"


@pytest.fixture
def two_condominium_ledger(company: Company, condominium: Condominium, other_condominium: Condominium, entry_batch: EntryBatch, make_entry):  # type: ignore[no-untyped-def]
    """`entry_batch` holds an entry of the first condominium; a second batch holds one of each condominium."""
    account = CurrentAccount.objects.create(company=company, condominium=other_condominium)
    center = CostCenter.objects.create(condominium=other_condominium, name="Obras")
    template = EntryTemplate.objects.create(cost_center=center, name="PG Obras")
    second = EntryBatch.objects.create(company=company, batch_date=date(2026, 10, 7), origin="bank")
    _ = post_entry(make_entry())
    _ = post_entry(make_entry(batch=second))
    _ = post_entry(make_entry(batch=second, current_account=account, cost_center=center, entry_template=template))
    return second


def test_a_batch_is_listed_for_each_condominium_it_has_an_entry_of(
    api_client: APIClient, condominium: Condominium, other_condominium: Condominium, two_condominium_ledger: EntryBatch, entry_batch: EntryBatch
) -> None:
    first = body(api_client.get(reverse(LIST), {"condominium": str(condominium.pk)}))
    other = body(api_client.get(reverse(LIST), {"condominium": str(other_condominium.pk)}))

    assert first["count"] == 2  # a batch with two entries of the condominium is not listed twice
    assert {item["id"] for item in first["results"]} == {str(entry_batch.pk), str(two_condominium_ledger.pk)}
    assert [item["id"] for item in other["results"]] == [str(two_condominium_ledger.pk)]


def test_the_condominium_filter_combines_with_the_others_and_must_be_an_id(
    api_client: APIClient, condominium: Condominium, two_condominium_ledger: EntryBatch
) -> None:
    on_the_day = body(api_client.get(reverse(LIST), {"condominium": str(condominium.pk), "batch_date": "2026-10-07"}))
    cash = body(api_client.get(reverse(LIST), {"condominium": str(condominium.pk), "origin": "cash"}))
    invalid = api_client.get(reverse(LIST), {"condominium": "not-an-id"})

    assert [item["id"] for item in on_the_day["results"]] == [str(two_condominium_ledger.pk)]
    assert cash["count"] == 0
    assert invalid.status_code == status.HTTP_400_BAD_REQUEST
