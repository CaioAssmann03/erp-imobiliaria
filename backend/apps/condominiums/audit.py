from apps.core.audit import register_audited

from .models import (
    Address,
    AdministrationContract,
    BillingRules,
    Block,
    Condominium,
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
        LateInterestRate,
        Unit,
        UnitPerson,
    ):
        register_audited(model)
