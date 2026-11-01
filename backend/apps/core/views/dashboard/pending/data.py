from datetime import timedelta

from apps.condominiums.models.querysets.condominium_administration_contract import (
    ADJUSTMENT_ALERT_DAYS,
)

from ..context import DashboardContext
from ..scoped_data import ScopedData


def pending_counters(context: DashboardContext, data: ScopedData) -> dict[str, int]:
    # The adjustments are already loaded in the context: counting them there avoids reading the contracts again.
    window_end = context.reference_date + timedelta(days=ADJUSTMENT_ALERT_DAYS)
    return {
        "units_without_responsible": context.units_without_responsible.count(),
        "inconsistent_apportionment": data.condominiums.with_inconsistent_apportionment().count(),
        "overdue_adjustments": sum(adjustment["overdue"] for adjustment in context.adjustments),
        "adjustments_next_30_days": sum(
            context.reference_date <= adjustment["date"] <= window_end for adjustment in context.adjustments
        ),
        "leases_ending": context.leases.count(),
        "without_cost_centers": data.condominiums.without_cost_centers().count(),
        "billing_blocked_units": data.units.billing_blocked().count(),
    }
