from apps.core.errors.base import RuleError


class PersonError(RuleError):
    MODULES_EMPTY = (
        "person.modules.empty",
        "A person must belong to at least one module.",
    )
    MODULES_UNKNOWN = (
        "person.modules.unknown",
        "The person has an unknown module.",
    )
