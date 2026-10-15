from apps.core.errors.base import RuleError


class UnitPersonError(RuleError):
    END_DATE_BEFORE_START_DATE = (
        "unit_person.end_date.before_start_date",
        "End date cannot be before start date.",
    )
    PERCENTAGE_REQUIRED_FOR_OWNER = (
        "unit_person.ownership_percentage.required_for_owner",
        "Owner needs a percentage between 0 and 100.",
    )
    PERCENTAGE_NOT_ALLOWED_FOR_TENANT = (
        "unit_person.ownership_percentage.not_allowed_for_tenant",
        "Tenant cannot have an ownership percentage.",
    )
    PERCENTAGE_SUM_EXCEEDS_100 = (
        "unit_person.ownership_percentage.sum_exceeds_100",
        "Owners of this unit would exceed 100% at the same time.",
    )
    DUPLICATE_ACTIVE_LINK = (
        "unit_person.person.duplicate_active_link",
        "This person already has an active link with this role.",
    )
    PERSON_OTHER_COMPANY = (
        "unit_person.person.other_company",
        "Person belongs to another company.",
    )
    PERSON_NOT_IN_CONDOMINIUMS = (
        "unit_person.person.not_in_condominiums",
        "The person is not registered for condominiums.",
    )
