from apps.core.errors.base import RuleError


class AdministrationContractError(RuleError):
    FEE_AMOUNT_REQUIRED_FOR_FIXED = (
        "administration_contract.fee_amount.required_for_fixed",
        "Fixed fee requires an amount.",
    )
    # One rule for the variable fee: percentage and basis together.
    VARIABLE_FEE_INCOMPLETE = (
        "administration_contract.variable_fee.requires_percentage_and_basis",
        "Variable fee requires percentage and basis.",
    )
    FEE_FLOOR_EXCEEDS_CEILING = (
        "administration_contract.fee_floor.exceeds_ceiling",
        "Floor cannot exceed ceiling.",
    )
