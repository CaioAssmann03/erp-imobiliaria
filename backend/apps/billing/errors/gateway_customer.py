from apps.core.errors.base import RuleError


class GatewayCustomerError(RuleError):
    DUPLICATE_FOR_ACCOUNT = (
        "gateway_customer.person.duplicate_for_account",
        "The person is already a customer of this gateway account.",
    )
