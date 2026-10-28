from apps.condominiums.models.querysets import CondominiumAdministrationContractQuerySet

LARGEST_FEES_LIMIT = 8


def fixed_revenue(
    all_contracts: CondominiumAdministrationContractQuerySet,
) -> dict[str, object]:
    contracts = all_contracts.of_active_condominiums()
    return {
        "monthly_total": contracts.fixed_fee_total(),
        "fixed_condominiums": contracts.with_fixed_fee().count(),
        "variable_condominiums": contracts.with_variable_fee().count(),
        "largest": [
            {
                "id": c.condominium_id,
                "name": c.condominium.name,
                "amount": c.fee_amount,
            }
            for c in contracts.largest_fixed_fees()[:LARGEST_FEES_LIMIT]
        ],
    }
