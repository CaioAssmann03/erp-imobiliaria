from ..context import DashboardContext
from ..scoped_data import ScopedData


def pending_counters(context: DashboardContext, data: ScopedData) -> dict[str, int]:
    return {
        "units_without_responsible": context.units_without_responsible.count(),
        "inconsistent_apportionment": data.condominiums.with_inconsistent_apportionment().count(),
        "overdue_adjustments": len(
            data.contracts.overdue_adjustment_condominium_ids(context.reference_date)
        ),
        "adjustments_next_30_days": len(
            data.contracts.upcoming_adjustment_condominium_ids(context.reference_date)
        ),
        "leases_ending": context.leases.count(),
        "without_cost_centers": data.condominiums.without_cost_centers().count(),
        "billing_blocked_units": data.units.billing_blocked().count(),
    }
