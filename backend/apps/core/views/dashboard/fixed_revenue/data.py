from apps.condominiums.models import CondominiumAdministrationContract
from apps.condominiums.models.querysets import CondominiumAdministrationContractQuerySet

LARGEST_FEES_LIMIT = 8


def fee_row(contract: CondominiumAdministrationContract) -> dict[str, object]:
    """One line of the largest fixed fees: the condominium and what it pays a month."""
    return {"id": contract.condominium_id, "name": contract.condominium.name, "amount": contract.fee_amount}


def fixed_revenue(
    all_contracts: CondominiumAdministrationContractQuerySet,
) -> dict[str, object]:
    contracts = all_contracts.of_active_condominiums()
    return {
        "monthly_total": contracts.fixed_fee_total(),
        "fixed_condominiums": contracts.with_fixed_fee().count(),
        "variable_condominiums": contracts.with_variable_fee().count(),
        "largest": [fee_row(contract) for contract in contracts.largest_fixed_fees()[:LARGEST_FEES_LIMIT]],
    }
