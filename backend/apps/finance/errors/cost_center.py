from apps.core.infrastructure.errors.base import RuleError


class CostCenterError(RuleError):
    NAME_DUPLICATE_IN_CONDOMINIUM = (
        "cost_center.name.duplicate_in_condominium",
        "This condominium already has a cost center with this name.",
    )
    CONDOMINIUM_IMMUTABLE = (
        "cost_center.condominium.immutable",
        "The condominium of a cost center cannot be changed.",
    )
    DELETION_HAS_ENTRY_TEMPLATES = (
        "cost_center.deletion.has_entry_templates",
        "This cost center has entry templates; deactivate it instead.",
    )
