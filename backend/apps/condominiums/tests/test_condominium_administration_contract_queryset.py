"""CondominiumAdministrationContractQuerySet: the filters the adjustment readers share."""

from datetime import date
from decimal import Decimal

import pytest

from apps.core.models import Company

from ..models import CondominiumAdministrationContract, Condominium

pytestmark = pytest.mark.django_db

CNPJS = ["11222333000181", "45723174000110", "11444777000161", "34028316000103"]


def make_contract(
    company: Company,
    name: str,
    cnpj: str,
    *,
    active: bool = True,
    base_date: date | None = None,
    **fee: object,
) -> CondominiumAdministrationContract:
    condominium = Condominium.objects.create(company=company, name=name, cnpj=cnpj, active=active)
    fields = {"fee_type": "fixed", "fee_amount": Decimal(100), **fee}
    return CondominiumAdministrationContract.objects.create(
        condominium=condominium,
        adjustment_base_date=base_date,
        adjustment_period_months=12,
        **fields,
    )


def make_variable_contract(company: Company, name: str, cnpj: str) -> CondominiumAdministrationContract:
    return make_contract(
        company, name, cnpj, fee_type="variable", fee_amount=None, fee_percentage=Decimal(5), fee_basis="revenue"
    )


def condominium_names(contracts) -> list[str]:  # type: ignore[no-untyped-def]
    return sorted(contract.condominium.name for contract in contracts)


def test_of_active_condominiums_leaves_out_inactive_ones(company: Company) -> None:
    make_contract(company, "Ativo", CNPJS[0])
    make_contract(company, "Inativo", CNPJS[1], active=False)

    assert condominium_names(CondominiumAdministrationContract.objects.of_active_condominiums()) == ["Ativo"]


def test_with_scheduled_adjustment_needs_a_base_date(company: Company) -> None:
    make_contract(company, "Com data", CNPJS[0], base_date=date(2026, 1, 10))
    make_contract(company, "Sem data", CNPJS[1])

    assert condominium_names(CondominiumAdministrationContract.objects.with_scheduled_adjustment()) == ["Com data"]


def test_the_two_filters_chain(company: Company) -> None:
    make_contract(company, "Ativo com data", CNPJS[0], base_date=date(2026, 1, 10))
    make_contract(company, "Ativo sem data", CNPJS[1])
    make_contract(company, "Inativo com data", CNPJS[2], active=False, base_date=date(2026, 1, 10))
    make_contract(company, "Inativo sem data", CNPJS[3], active=False)

    contracts = CondominiumAdministrationContract.objects.of_active_condominiums().with_scheduled_adjustment()

    assert condominium_names(contracts) == ["Ativo com data"]


def test_with_fixed_fee_and_with_variable_fee_split_by_fee_type(company: Company) -> None:
    make_contract(company, "Fixo", CNPJS[0])
    make_variable_contract(company, "Variavel", CNPJS[1])

    assert condominium_names(CondominiumAdministrationContract.objects.with_fixed_fee()) == ["Fixo"]
    assert condominium_names(CondominiumAdministrationContract.objects.with_variable_fee()) == ["Variavel"]


def test_fixed_fee_total_sums_only_fixed_fees(company: Company) -> None:
    make_contract(company, "A", CNPJS[0], fee_amount=Decimal("150.50"))
    make_contract(company, "B", CNPJS[1], fee_amount=Decimal("49.50"))
    make_variable_contract(company, "Variavel", CNPJS[2])

    assert CondominiumAdministrationContract.objects.fixed_fee_total() == Decimal("200.00")


def test_fixed_fee_total_is_zero_without_fixed_fees(company: Company) -> None:
    make_variable_contract(company, "Variavel", CNPJS[0])

    assert CondominiumAdministrationContract.objects.fixed_fee_total() == Decimal(0)
    assert CondominiumAdministrationContract.objects.none().fixed_fee_total() == Decimal(0)


def test_largest_fixed_fees_orders_by_amount_and_leaves_out_zero_and_variable(company: Company) -> None:
    make_contract(company, "Media", CNPJS[0], fee_amount=Decimal(200))
    make_contract(company, "Maior", CNPJS[1], fee_amount=Decimal(900))
    make_contract(company, "Zero", CNPJS[2], fee_amount=Decimal(0))
    make_variable_contract(company, "Variavel", CNPJS[3])

    names = [contract.condominium.name for contract in CondominiumAdministrationContract.objects.largest_fixed_fees()]

    assert names == ["Maior", "Media"]


def test_largest_fixed_fees_loads_the_condominium_in_one_query(company: Company, django_assert_num_queries) -> None:  # type: ignore[no-untyped-def]
    make_contract(company, "A", CNPJS[0], fee_amount=Decimal(200))
    make_contract(company, "B", CNPJS[1], fee_amount=Decimal(300))

    with django_assert_num_queries(1):
        names = [contract.condominium.name for contract in CondominiumAdministrationContract.objects.largest_fixed_fees()]

    assert names == ["B", "A"]
