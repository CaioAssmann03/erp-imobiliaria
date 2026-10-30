from apps.core.infrastructure.errors.base import RuleError


class SupplierError(RuleError):
    BANK_DATA_INCOMPLETE = (
        "supplier.bank_data.incomplete",
        "Bank code, branch and account number must be filled together.",
    )
    ARCHIVE_HAS_OPEN_ACCOUNTS_PAYABLE = (
        "supplier.archive.has_open_accounts_payable",
        "This supplier has open accounts payable; pay or cancel them first.",
    )
    PERSON_HAS_ARCHIVED_SUPPLIER = (
        "supplier.person.has_archived_supplier",
        "This person has a deleted supplier; restore it instead of registering a new one.",
    )
