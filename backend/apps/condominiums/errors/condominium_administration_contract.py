from apps.core.infrastructure.errors.base import RuleError


class CondominiumAdministrationContractError(RuleError):
    FEE_AMOUNT_REQUIRED_FOR_FIXED = (
        "condominium_administration_contract.fee_amount.required_for_fixed",
        "Fixed fee requires an amount.",
    )
    # One rule for the variable fee: percentage and basis together.
    VARIABLE_FEE_INCOMPLETE = (
        "condominium_administration_contract.variable_fee.requires_percentage_and_basis",
        "Variable fee requires percentage and basis.",
    )
    FEE_FLOOR_EXCEEDS_CEILING = (
        "condominium_administration_contract.fee_floor.exceeds_ceiling",
        "Floor cannot exceed ceiling.",
    )
