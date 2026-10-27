from typing import TYPE_CHECKING

from apps.condominiums.errors import CondominiumAdministrationContractError
from apps.core.models.rules import ModelRules, rule

if TYPE_CHECKING:
    # Used only in the string generic argument below: ruff cannot see it, hence the noqa.
    from apps.condominiums.models.condominium_administration_contract import (
        CondominiumAdministrationContract,  # noqa: F401
    )


class CondominiumAdministrationContractRules(ModelRules["CondominiumAdministrationContract"]):
    """Each rule is also guarded by a check constraint."""

    @rule("fee_amount", CondominiumAdministrationContractError.FEE_AMOUNT_REQUIRED_FOR_FIXED)
    def fixed_fee_lacks_amount(self) -> bool:
        contract = self.instance
        return (
            contract.fee_type == contract.FeeType.FIXED and contract.fee_amount is None
        )

    @rule("fee_percentage", CondominiumAdministrationContractError.VARIABLE_FEE_INCOMPLETE)
    def variable_fee_lacks_percentage(self) -> bool:
        contract = self.instance
        return (
            contract.fee_type == contract.FeeType.VARIABLE
            and contract.fee_percentage is None
        )

    @rule("fee_basis", CondominiumAdministrationContractError.VARIABLE_FEE_INCOMPLETE)
    def variable_fee_lacks_basis(self) -> bool:
        contract = self.instance
        return contract.fee_type == contract.FeeType.VARIABLE and not contract.fee_basis

    @rule("fee_floor", CondominiumAdministrationContractError.FEE_FLOOR_EXCEEDS_CEILING)
    def floor_exceeds_ceiling(self) -> bool:
        contract = self.instance
        return (
            contract.fee_floor is not None
            and contract.fee_ceiling is not None
            and contract.fee_floor > contract.fee_ceiling
        )
