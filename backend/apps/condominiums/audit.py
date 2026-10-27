from apps.core.infrastructure.audit import register_audited

from .models import (
    AdministrationContract,
    CondominiumApportionmentCriterion,
    Block,
    Condominium,
    Unit,
    UnitApportionmentFraction,
    UnitPerson,
)


def register() -> None:
    for model in (
        AdministrationContract,
        CondominiumApportionmentCriterion,
        Block,
        Condominium,
        Unit,
        UnitApportionmentFraction,
        UnitPerson,
    ):
        register_audited(model)
