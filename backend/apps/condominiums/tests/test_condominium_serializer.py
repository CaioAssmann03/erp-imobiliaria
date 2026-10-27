import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.accounts.models import User
from apps.core.models import Address, Company

from ..models import AdministrationContract, Condominium
from ..serializers import CondominiumSerializer
from .conftest import VALID_CNPJ

pytestmark = pytest.mark.django_db


def payload(company: Company, **extra: object) -> dict[str, object]:
    return {"company": company.pk, "name": "Residencial Sol", "cnpj": VALID_CNPJ, **extra}


def request_context(company: Company) -> dict[str, object]:
    """The serializer reads the user's company from the request (spec 004)."""
    user = User.objects.create_user(f"user-{User.objects.count()}", password="x", company=company)
    request = APIRequestFactory().post("/")
    force_authenticate(request, user=user)
    request.user = user
    return {"request": request}


def save(
    company: Company, data: dict[str, object], instance: Condominium | None = None
) -> Condominium:
    serializer = CondominiumSerializer(
        instance, data=data, partial=instance is not None, context=request_context(company)
    )
    serializer.is_valid(raise_exception=True)
    return serializer.save()


def test_create_with_all_nested_parts(company: Company) -> None:
    condominium = save(
        company,
        payload(
            company,
            address={"street": "Rua A", "city": "Curitiba", "state": "PR"},
            administration_contract={"fee_type": "fixed", "fee_amount": "500"},
        )
    )

    assert condominium.address is not None
    assert condominium.address.city == "Curitiba"
    assert condominium.administration_contract.fee_amount == 500


def test_create_without_nested_parts(company: Company) -> None:
    condominium = save(company, payload(company))

    assert condominium.address is None
    assert not AdministrationContract.objects.exists()


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
    updated = save(condominium.company, {"address": {"city": "Curitiba"}}, condominium)

    assert updated.address is not None
    assert updated.address.city == "Curitiba"


def test_update_changes_existing_address_in_place(condominium: Condominium) -> None:
    condominium.address = Address.objects.create(company=condominium.company, city="Curitiba", state="PR")
    condominium.save()
    address_id = condominium.address.pk

    updated = save(condominium.company, {"address": {"city": "Londrina"}}, condominium)

    assert updated.address is not None
    assert updated.address.pk == address_id
    assert Address.objects.count() == 1
    assert updated.address.city == "Londrina"
    assert updated.address.state == "PR"


def test_update_upserts_the_contract(condominium: Condominium) -> None:
    _ = save(condominium.company, {"administration_contract": {"fee_amount": "500"}}, condominium)
    _ = save(condominium.company, {"administration_contract": {"fee_amount": "700"}}, condominium)

    assert AdministrationContract.objects.count() == 1
    assert AdministrationContract.objects.get().fee_amount == 700


def test_update_without_nested_parts_keeps_them(condominium: Condominium) -> None:
    _ = save(condominium.company, {"administration_contract": {"fee_amount": "500"}}, condominium)

    _ = save(condominium.company, {"name": "Novo Nome"}, condominium)

    assert AdministrationContract.objects.get().fee_amount == 500
