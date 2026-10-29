from apps.core.infrastructure.errors.base import RuleError


class CostCenterCatalogItemError(RuleError):
    CODE_DUPLICATE_IN_COMPANY = (
        "cost_center_catalog_item.code.duplicate_in_company",
        "The catalog already has a sub-conta with this code.",
    )
    NAME_DUPLICATE_IN_COMPANY = (
        "cost_center_catalog_item.name.duplicate_in_company",
        "The catalog already has a sub-conta with this name.",
    )
    DELETION_IN_USE = (
        "cost_center_catalog_item.deletion.in_use",
        "Condominiums use this sub-conta; deactivate it instead.",
    )
