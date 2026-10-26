from apps.core.infrastructure.audit import register_audited

from .models import (
    Address,
    AdministrationContract,
    ApportionmentCriterion,
    BillingRules,
    Block,
    Condominium,
    LateInterestRate,
    Unit,
    UnitFraction,
    UnitPerson,
)


def register() -> None:
    for model in (
        Address,
        AdministrationContract,
        ApportionmentCriterion,
        BillingRules,
        Block,
        Condominium,
        LateInterestRate,
        Unit,
        UnitFraction,
        UnitPerson,
    ):
        register_audited(model)
