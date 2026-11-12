from apps.core.infrastructure.errors.base import RuleError


class PeopleLegalError(RuleError):
    COMPANY_MISMATCH = (
        "people_legal.company.mismatch",
        "The document must belong to the same company as the person.",
    )
    CNPJ_DUPLICATE_IN_COMPANY = (
        "people_legal.cnpj.duplicate_in_company",
        "A person with this CNPJ already exists in this company (it may have been deleted: ask an administrator to restore it).",
    )
