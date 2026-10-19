from decimal import Decimal

import pytest

from apps.condominiums.models import Condominium
from apps.core.models import Company
from apps.finance.models import CostCenter, EntryTemplate

from ..models import BillingPlan, BillingPlanItem

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
