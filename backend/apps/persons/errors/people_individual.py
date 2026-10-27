from apps.core.infrastructure.errors.base import RuleError


class PeopleIndividualError(RuleError):
    COMPANY_MISMATCH = (
        "people_individual.company.mismatch",
        "The document must belong to the same company as the person.",
    )
    CPF_DUPLICATE_IN_COMPANY = (
        "people_individual.cpf.duplicate_in_company",
        "A person with this CPF already exists in this company.",
    )
    RG_DUPLICATE_IN_COMPANY = (
        "people_individual.rg.duplicate_in_company",
        "A person with this RG already exists in this company.",
    )
