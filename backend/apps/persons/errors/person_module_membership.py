from apps.core.infrastructure.errors.base import RuleError


class PersonModuleMembershipError(RuleError):
    MODULE_UNKNOWN = (
        "person_module_membership.module.unknown",
        "The module is not registered.",
    )
    ALREADY_RELEASED = (
        "person_module_membership.person.already_released",
        "The person is already released to this module.",
    )
