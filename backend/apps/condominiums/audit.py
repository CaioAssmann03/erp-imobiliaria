from apps.core.infrastructure.audit import register_audited

from .models import (
    Address,
    AdministrationContract,
    BillingRules,
    Block,
    Condominium,
    CondominiumPersonMember,
    LateInterestRate,
    Unit,
    UnitPerson,
)


def register() -> None:
    for model in (
        Address,
        AdministrationContract,
        BillingRules,
        Block,
        Condominium,
        CondominiumPersonMember,
        LateInterestRate,
        Unit,
        UnitPerson,
    ):
        register_audited(model)
