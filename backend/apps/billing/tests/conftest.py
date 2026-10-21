from datetime import date
from decimal import Decimal

import pytest

from apps.condominiums.models import BillingRules, Condominium, LateInterestRate, Unit
from apps.core.models import Company
from apps.finance.models import CostCenter, EntryTemplate
from apps.persons.models import Person

from ..models import BillingDocument, BillingPlan, BillingPlanItem
from ..services.create_billing_document import (
    NewBillingDocument,
    NewBillingDocumentItem,
    create_billing_document,
)

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
    return CostCenter.objects.create(condominium=condominium, name="Taxa Ordinária")


@pytest.fixture
def entry_template(cost_center: CostCenter) -> EntryTemplate:
    return EntryTemplate.objects.create(cost_center=cost_center, name="REC Taxa Ordinária")


@pytest.fixture
def plan(condominium: Condominium) -> BillingPlan:
    return BillingPlan.objects.create(condominium=condominium, name="Ordinária")


@pytest.fixture
def build_item(plan: BillingPlan, cost_center: CostCenter, entry_template: EntryTemplate):  # type: ignore[no-untyped-def]
    """An unsaved fixed-amount item of the plan; `overrides` change any field."""

    def build(**overrides):  # type: ignore[no-untyped-def]
        fields = {
            "plan": plan,
            "description": "Taxa condominial",
            "cost_center": cost_center,
            "entry_template": entry_template,
            "calculation_kind": BillingPlanItem.CalculationKind.FIXED_AMOUNT,
            "amount": Decimal("450.00"),
        }
        return BillingPlanItem(**{**fields, **overrides})

    return build


@pytest.fixture
def unit(condominium: Condominium) -> Unit:
    return Unit.objects.create(condominium=condominium, name="101")


@pytest.fixture
def payer(company: Company) -> Person:
    return Person.objects.create(company=company, name="Maria Souza")


@pytest.fixture
def billing_rules(condominium: Condominium) -> BillingRules:
    _ = LateInterestRate.objects.create(
        condominium=condominium, start_date=date(2026, 1, 1), monthly_percentage=Decimal("1.00")
    )
    return BillingRules.objects.create(
        condominium=condominium,
        early_payment_discount_percentage=Decimal("5.00"),
        early_payment_discount_days=3,
        late_fee_percentage=Decimal("2.00"),
        interest_grace_days=1,
    )


@pytest.fixture
def new_document(unit: Unit, payer: Person, cost_center: CostCenter, entry_template: EntryTemplate):  # type: ignore[no-untyped-def]
    """A `NewBillingDocument` of October 2026 with two items (400.00 + 50.00); `overrides` change any field."""

    def build(**overrides):  # type: ignore[no-untyped-def]
        fields = {
            "unit": unit,
            "payer": payer,
            "reference_month": date(2026, 10, 1),
            "competence_month": date(2026, 10, 1),
            "due_date": date(2026, 10, 10),
            "items": (
                NewBillingDocumentItem("Taxa condominial", cost_center, entry_template, Decimal("400.00")),
                NewBillingDocumentItem("Fundo de reserva", cost_center, entry_template, Decimal("50.00")),
            ),
        }
        return NewBillingDocument(**{**fields, **overrides})

    return build


@pytest.fixture
def document(billing_rules: BillingRules, new_document) -> BillingDocument:  # type: ignore[no-untyped-def]
    return create_billing_document(new_document())


@pytest.fixture
def make_plan_item(plan: BillingPlan, cost_center: CostCenter, entry_template: EntryTemplate):  # type: ignore[no-untyped-def]
    """A saved item of `plan`; `overrides` change any field (the default is a fixed 450.00)."""

    def make(position: int = 1, **overrides):  # type: ignore[no-untyped-def]
        fields = {
            "plan": plan,
            "position": position,
            "description": "Taxa condominial",
            "cost_center": cost_center,
            "entry_template": entry_template,
            "calculation_kind": BillingPlanItem.CalculationKind.FIXED_AMOUNT,
            "amount": Decimal("450.00"),
        }
        return BillingPlanItem.objects.create(**{**fields, **overrides})

    return make


@pytest.fixture
def make_unit(condominium: Condominium):  # type: ignore[no-untyped-def]
    def make(name: str, **overrides) -> Unit:  # type: ignore[no-untyped-def]
        return Unit.objects.create(condominium=condominium, name=name, **overrides)

    return make


@pytest.fixture
def link(company: Company):  # type: ignore[no-untyped-def]
    """Link a person to a unit as an owner (with a percentage) or a tenant."""
    from apps.condominiums.models import UnitPerson

    def make(unit: Unit, name: str, role: str = "owner", percentage: str | None = "100", **overrides) -> Person:  # type: ignore[no-untyped-def]
        person = Person.objects.create(company=company, name=name)
        _ = UnitPerson.objects.create(
            unit=unit,
            person=person,
            role=role,
            ownership_percentage=Decimal(percentage) if role == "owner" and percentage else None,
            start_date=overrides.pop("start_date", date(2020, 1, 1)),
            **overrides,
        )
        return person

    return make
