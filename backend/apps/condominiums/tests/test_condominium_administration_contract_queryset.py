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


def test_fixed_fee_total_sums_only_fixed_fees(company: Company) -> None:
    make_contract(company, "A", CNPJS[0], fee_amount=Decimal("150.50"))
    make_contract(company, "B", CNPJS[1], fee_amount=Decimal("49.50"))
    make_variable_contract(company, "Variavel", CNPJS[2])

    assert CondominiumAdministrationContract.objects.fixed_fee_total() == Decimal("200.00")


def test_largest_fixed_fees_orders_by_amount_and_leaves_out_zero_and_variable(company: Company) -> None:
    make_contract(company, "Media", CNPJS[0], fee_amount=Decimal(200))
    make_contract(company, "Maior", CNPJS[1], fee_amount=Decimal(900))
    make_contract(company, "Zero", CNPJS[2], fee_amount=Decimal(0))
    make_variable_contract(company, "Variavel", CNPJS[3])

    names = [contract.condominium.name for contract in CondominiumAdministrationContract.objects.largest_fixed_fees()]

    assert names == ["Maior", "Media"]
