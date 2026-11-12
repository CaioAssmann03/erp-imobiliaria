"""Spec 062, R3: a sub-conta used by an active billing plan cannot be deleted (archived)."""

import pytest

from apps.finance.models import CostCenter
from apps.finance.models.rules.cost_center_archive import CostCenterArchiveRules

from ..models import BillingPlan

pytestmark = pytest.mark.django_db


def test_a_sub_conta_in_an_active_plan_is_not_archivable(  # type: ignore[no-untyped-def]
    cost_center: CostCenter, make_plan_item
) -> None:
    _ = make_plan_item()

    assert CostCenterArchiveRules(cost_center).is_in_active_billing_plan()


def test_a_sub_conta_of_an_inactive_plan_passes_this_rule(  # type: ignore[no-untyped-def]
    cost_center: CostCenter, plan: BillingPlan, make_plan_item
) -> None:
    _ = make_plan_item()
    plan.active = False
    plan.save()

    assert not CostCenterArchiveRules(cost_center).is_in_active_billing_plan()
