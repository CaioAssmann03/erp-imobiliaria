from apps.condominiums.models import Unit

from .context import DashboardContext
from .scoped_data import ScopedData


def pending_counters(context: DashboardContext, data: ScopedData) -> dict[str, int]:
    inconsistent_ids = Unit.objects.inconsistent_apportionment_condominium_ids()
    return {
        "units_without_responsible": context.units_without_responsible.count(),
        "inconsistent_apportionment": data.condominiums.filter(
            pk__in=inconsistent_ids
        ).count(),
        "overdue_adjustments": len(
            data.contracts.overdue_adjustment_condominium_ids(context.reference_date)  # type: ignore[attr-defined]
        ),
        "adjustments_next_30_days": len(
            data.contracts.upcoming_adjustment_condominium_ids(context.reference_date)  # type: ignore[attr-defined]
        ),
        "leases_ending": context.leases.count(),
        "without_cost_centers": data.condominiums.without_cost_centers().count(),  # type: ignore[attr-defined]
        "billing_blocked_units": data.units.filter(
            active=True, is_billing_blocked=True
        ).count(),
    }
