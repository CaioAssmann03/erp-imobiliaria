from apps.core.errors.base import RuleError


class CondominiumError(RuleError):
    ADVISOR_OTHER_COMPANY = (
        "condominium.advisor.other_company",
        "Advisor belongs to another company.",
    )
