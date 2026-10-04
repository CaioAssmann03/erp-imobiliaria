import pytest

from apps.core.models import Company

from ..models import Address, AdministrationContract, BillingRules, Condominium
from ..serializers import CondominiumSerializer
from .conftest import VALID_CNPJ

pytestmark = pytest.mark.django_db


def payload(company: Company, **extra: object) -> dict[str, object]:
    return {"company": company.pk, "name": "Residencial Sol", "cnpj": VALID_CNPJ, **extra}


def save(data: dict[str, object], instance: Condominium | None = None) -> Condominium:
    serializer = CondominiumSerializer(instance, data=data, partial=instance is not None)
    serializer.is_valid(raise_exception=True)
    return serializer.save()


def test_create_with_all_nested_parts(company: Company) -> None:
    condominium = save(
        payload(
            company,
            address={"street": "Rua A", "city": "Curitiba", "state": "PR"},
            administration_contract={"fee_type": "fixed", "fee_amount": "500"},
            billing_rules={"due_day": 5},
        )
    )

    assert condominium.address is not None
    assert condominium.address.city == "Curitiba"
    assert condominium.administration_contract.fee_amount == 500
    assert condominium.billing_rules.due_day == 5


def test_create_without_nested_parts(company: Company) -> None:
    condominium = save(payload(company))

    assert condominium.address is None
    assert not AdministrationContract.objects.exists()
    assert not BillingRules.objects.exists()


def test_invalid_nested_contract_rejects_the_whole_payload(company: Company) -> None:
    serializer = CondominiumSerializer(
        data=payload(company, administration_contract={"fee_type": "fixed"})
    )

    assert not serializer.is_valid()
    assert "administration_contract" in serializer.errors


def test_invalid_cnpj_is_rejected(company: Company) -> None:
    serializer = CondominiumSerializer(data={**payload(company), "cnpj": "12345678000100"})

    assert not serializer.is_valid()
    assert "cnpj" in serializer.errors


def test_cnpj_must_be_unique(condominium: Condominium) -> None:
    serializer = CondominiumSerializer(data=payload(condominium.company))

    assert not serializer.is_valid()
    assert "cnpj" in serializer.errors


def test_update_creates_address_when_missing(condominium: Condominium) -> None:
    updated = save({"address": {"city": "Curitiba"}}, condominium)

    assert updated.address is not None
    assert updated.address.city == "Curitiba"


def test_update_changes_existing_address_in_place(condominium: Condominium) -> None:
    condominium.address = Address.objects.create(city="Curitiba", state="PR")
    condominium.save()
    address_id = condominium.address.pk

    updated = save({"address": {"city": "Londrina"}}, condominium)

    assert updated.address is not None
    assert updated.address.pk == address_id
    assert Address.objects.count() == 1
    assert updated.address.city == "Londrina"
    assert updated.address.state == "PR"


def test_update_upserts_contract_and_billing_rules(condominium: Condominium) -> None:
    _ = save({"administration_contract": {"fee_amount": "500"}}, condominium)
    _ = save({"administration_contract": {"fee_amount": "700"}}, condominium)
    _ = save({"billing_rules": {"due_day": 7}}, condominium)
    _ = save({"billing_rules": {"due_day": 9}}, condominium)

    assert AdministrationContract.objects.count() == 1
    assert AdministrationContract.objects.get().fee_amount == 700
    assert BillingRules.objects.count() == 1
    assert BillingRules.objects.get().due_day == 9


def test_update_without_nested_parts_keeps_them(condominium: Condominium) -> None:
    _ = save({"billing_rules": {"due_day": 7}}, condominium)

    _ = save({"name": "Novo Nome"}, condominium)

    assert BillingRules.objects.get().due_day == 7
