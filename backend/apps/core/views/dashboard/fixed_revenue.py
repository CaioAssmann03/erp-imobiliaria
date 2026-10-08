from decimal import Decimal

from django.db import models
from django.db.models import Sum

from apps.condominiums.models import AdministrationContract


def fixed_revenue(
    all_contracts: models.QuerySet[AdministrationContract],
) -> dict[str, object]:
    contracts = all_contracts.filter(condominium__active=True)
    fixed = contracts.filter(fee_type=AdministrationContract.FeeType.FIXED)
    total = fixed.aggregate(total=Sum("fee_amount"))["total"] or Decimal("0")
    largest = fixed.filter(fee_amount__gt=0).select_related("condominium")
    return {
        "monthly_total": total,
        "fixed_condominiums": fixed.count(),
        "variable_condominiums": contracts.filter(
            fee_type=AdministrationContract.FeeType.VARIABLE
        ).count(),
        "largest": [
            {
                "id": c.condominium_id,
                "name": c.condominium.name,
                "amount": c.fee_amount,
            }
            for c in largest.order_by("-fee_amount")[:8]
        ],
    }
