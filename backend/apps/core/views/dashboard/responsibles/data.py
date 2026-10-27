from ..context import DashboardContext


def count_responsibles(context: DashboardContext) -> dict[str, int]:
    return {
        "active_units": context.active_units.count(),
        "with_responsible": context.units_with_responsible.count(),
    }
