from apps.core.infrastructure.errors.base import RuleError


class SupplierError(RuleError):
    BANK_DATA_INCOMPLETE = (
        "supplier.bank_data.incomplete",
        "Bank code, branch and account number must be filled together.",
    )
