import pytest

from apps.condominiums.models import Condominium
from apps.core.models import Company

from ..models import CostCenter

CNPJ_A = "11222333000181"
CNPJ_B = "45723174000110"


@pytest.fixture
def condominium(company: Company) -> Condominium:
    return Condominium.objects.create(company=company, name="Residencial Sol", cnpj=CNPJ_A)


@pytest.fixture
def other_condominium(company: Company) -> Condominium:
    """A second condominium of the same company."""
    return Condominium.objects.create(company=company, name="Edifício Lua", cnpj=CNPJ_B)


@pytest.fixture
def cost_center(condominium: Condominium) -> CostCenter:
    return CostCenter.objects.create(condominium=condominium, name="Fundo de Reserva")


@pytest.fixture
def person(company: Company):  # type: ignore[no-untyped-def]
    from apps.persons.models import Person

    return Person.objects.create(company=company, name="Companhia de Energia")


@pytest.fixture
def supplier(person):  # type: ignore[no-untyped-def]
    from ..models import Supplier

    return Supplier.objects.create(person=person)


@pytest.fixture
def make_account(company: Company, condominium: Condominium, cost_center: CostCenter, supplier):  # type: ignore[no-untyped-def]
    """Builds a saved open account payable of the condominium; `overrides` change any field."""
    from datetime import date
    from decimal import Decimal

    from ..models import AccountPayable

    def build(**overrides):  # type: ignore[no-untyped-def]
        fields = {
            "company": company,
            "condominium": condominium,
            "cost_center": cost_center,
            "supplier": supplier,
            "description": "CEEE - energia elétrica",
            "amount": Decimal("1250.00"),
            "due_date": date(2026, 10, 20),
        }
        return AccountPayable.objects.create(**{**fields, **overrides})

    return build
