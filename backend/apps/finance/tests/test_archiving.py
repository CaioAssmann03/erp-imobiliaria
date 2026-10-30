"""Spec 062: archiving suppliers, cost centers and condominiums with finance records (R3, R4, R9)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.condominiums.models import Condominium
from apps.condominiums.models.rules import CondominiumArchiveRules
from apps.persons.models import Person

from ..models import (
    AccountPayable,
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryTemplate,
    Supplier,
)
from .base import error_codes

pytestmark = pytest.mark.django_db


# ----- suppliers -----


def test_a_supplier_with_an_open_account_payable_cannot_be_deleted(  # type: ignore[no-untyped-def]
    api_client: APIClient, supplier: Supplier, make_account
) -> None:
    _ = make_account()

    response = api_client.delete(reverse("supplier-detail", args=[supplier.pk]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["supplier.archive.has_open_accounts_payable"]


def test_a_supplier_without_open_accounts_is_deleted_and_leaves_the_list(api_client: APIClient, supplier: Supplier) -> None:
    assert api_client.delete(reverse("supplier-detail", args=[supplier.pk])).status_code == status.HTTP_204_NO_CONTENT

    assert Supplier.all_objects.get(pk=supplier.pk).is_archived
    assert not Supplier.objects.filter(pk=supplier.pk).exists()


def test_a_new_supplier_for_a_person_with_a_deleted_one_is_refused(api_client: APIClient, supplier: Supplier, person: Person) -> None:
    _ = supplier.delete()

    response = api_client.post(reverse("supplier-list"), {"person": str(person.pk)}, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, "person") == ["supplier.person.has_archived_supplier"]


def test_an_active_supplier_keeps_its_person_from_being_deleted(api_client: APIClient, supplier: Supplier, person: Person) -> None:
    response = api_client.delete(reverse("person-detail", args=[person.pk]))

    assert error_codes(response, None) == ["person.archive.is_active_supplier"]

    _ = supplier.delete()
    assert api_client.delete(reverse("person-detail", args=[person.pk])).status_code == status.HTTP_204_NO_CONTENT


# ----- cost centers -----


def test_a_cost_center_with_entry_templates_cannot_be_deleted(
    api_client: APIClient, cost_center: CostCenter, entry_template: EntryTemplate
) -> None:
    response = api_client.delete(reverse("cost-center-detail", args=[cost_center.pk]))

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert error_codes(response, None) == ["cost_center.deletion.has_entry_templates"]


def test_a_deleted_cost_center_frees_its_name_and_code(condominium: Condominium) -> None:
    first = CostCenter.objects.create(condominium=condominium, name="Fundo de Obras")
    _ = first.delete()

    second = CostCenter.objects.create(condominium=condominium, name="Fundo de Obras")

    assert CostCenter.objects.get(name="Fundo de Obras") == second


# ----- condominiums -----


def test_an_open_account_payable_blocks_archiving_its_condominium(  # type: ignore[no-untyped-def]
    condominium: Condominium, make_account
) -> None:
    _ = make_account()

    assert CondominiumArchiveRules(condominium).has_open_accounts_payable()


def test_archiving_a_condominium_keeps_its_ledger(  # type: ignore[no-untyped-def]
    condominium: Condominium, current_account: CurrentAccount, make_entry
) -> None:
    entry = make_entry()
    entry.save()
    CostCenter.all_objects.filter(condominium=condominium).update(deleted_at="2026-01-01T00:00:00Z")
    condominium.active = False
    condominium.save()

    _ = condominium.delete()

    assert Condominium.all_objects.get(pk=condominium.pk).is_archived
    assert CurrentAccount.objects.filter(pk=current_account.pk).exists()
    assert CurrentAccountEntry.objects.filter(pk=entry.pk).exists()
    assert CurrentAccount.objects.get(pk=current_account.pk).condominium == condominium
    assert AccountPayable.objects.count() == 0
