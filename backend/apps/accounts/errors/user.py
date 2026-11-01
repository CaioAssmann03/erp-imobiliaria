from apps.core.infrastructure.errors.base import RuleError


class UserError(RuleError):
    COMPANY_IMMUTABLE = (
        "user.company.immutable",
        "A user stays in the company it was created in; create a new user for the other company.",
    )
