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
def make_account(company: Company, condominium: Condominium, cost_center: CostCenter, supplier, entry_template):  # type: ignore[no-untyped-def]
    """Builds a saved open account payable of the condominium; `overrides` change any field.

    A condominium expense of the default cost center carries the default entry template (needed to pay it).
    """
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
        merged = {**fields, **overrides}
        uses_default_cost_center = merged["cost_center"] is cost_center
        if "entry_template" not in overrides and merged["condominium"] is not None and uses_default_cost_center:
            merged["entry_template"] = entry_template
        return AccountPayable.objects.create(**merged)

    return build


@pytest.fixture
def current_account(company: Company, condominium: Condominium):  # type: ignore[no-untyped-def]
    from ..models import CurrentAccount

    return CurrentAccount.objects.create(company=company, condominium=condominium)


@pytest.fixture
def entry_batch(company: Company):  # type: ignore[no-untyped-def]
    import datetime

    from ..models import EntryBatch

    return EntryBatch.objects.create(
        company=company, batch_date=datetime.date(2026, 10, 6), origin="bank"
    )


@pytest.fixture
def entry_template(cost_center: CostCenter):  # type: ignore[no-untyped-def]
    from ..models import EntryTemplate

    return EntryTemplate.objects.create(cost_center=cost_center, name="PG CEEE")


@pytest.fixture
def make_entry(  # type: ignore[no-untyped-def]
    company, current_account, entry_batch, entry_template, cost_center, staff_user
):
    """Build (not save) a valid ledger entry; pass keyword overrides to change a field."""
    import datetime
    from decimal import Decimal
    from typing import Any

    from ..models import CurrentAccountEntry

    def build(**overrides: Any) -> CurrentAccountEntry:
        values: dict[str, Any] = {
            "company": company,
            "current_account": current_account,
            "batch": entry_batch,
            "entry_template": entry_template,
            "cost_center": cost_center,
            "entry_date": datetime.date(2026, 10, 6),
            "competence_month": datetime.date(2026, 10, 1),
            "kind": CurrentAccountEntry.Kind.DEBIT,
            "amount": Decimal("100.00"),
            "description": "CEEE - Energia",
            "justification": "Bank fee",
            "created_by": staff_user,
        }
        values.update(overrides)
        return CurrentAccountEntry(**values)

    return build
