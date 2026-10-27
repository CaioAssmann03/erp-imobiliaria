from apps.core.infrastructure.audit import register_audited

from .models import (
    Address,
    AdministrationContract,
    ApportionmentCriterion,
    Block,
    Condominium,
    Unit,
    UnitFraction,
    UnitPerson,
)


def register() -> None:
    for model in (
        Address,
        AdministrationContract,
        ApportionmentCriterion,
        Block,
        Condominium,
        Unit,
        UnitFraction,
        UnitPerson,
    ):
        register_audited(model)
