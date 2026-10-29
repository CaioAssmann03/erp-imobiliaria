from apps.core.infrastructure.errors.base import RuleError


class CostCenterError(RuleError):
    NAME_DUPLICATE_IN_CONDOMINIUM = (
        "cost_center.name.duplicate_in_condominium",
        "This condominium already has a cost center with this name.",
    )
    CODE_DUPLICATE_IN_CONDOMINIUM = (
        "cost_center.code.duplicate_in_condominium",
        "This condominium already has a cost center with this code.",
    )
    CONDOMINIUM_IMMUTABLE = (
        "cost_center.condominium.immutable",
        "The condominium of a cost center cannot be changed.",
    )
    DELETION_HAS_ENTRY_TEMPLATES = (
        "cost_center.deletion.has_entry_templates",
        "This cost center has entry templates; deactivate it instead.",
    )
    CATALOG_ITEM_DUPLICATE_IN_CONDOMINIUM = (
        "cost_center.catalog_item.duplicate_in_condominium",
        "This condominium already uses this sub-conta of the catalog.",
    )
    CATALOG_ITEM_OTHER_COMPANY = (
        "cost_center.catalog_item.other_company",
        "The sub-conta of the catalog must belong to the condominium's company.",
    )
    CATALOG_ITEM_INACTIVE = (
        "cost_center.catalog_item.inactive",
        "An inactive sub-conta of the catalog cannot be used for a new one.",
    )
    CATALOG_ITEM_IMMUTABLE = (
        "cost_center.catalog_item.immutable",
        "The catalog sub-conta of a cost center cannot be changed.",
    )
