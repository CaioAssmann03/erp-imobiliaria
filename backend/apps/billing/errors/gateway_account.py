from apps.core.infrastructure.errors.base import RuleError


class GatewayAccountError(RuleError):
    CONDOMINIUM_ADDRESS_INCOMPLETE = (
        "gateway_account.condominium.address_incomplete",
        "The condominium needs a complete address (street, number, district, zip code) to open a gateway account.",
    )
    ALREADY_REGISTERED_REMOTELY = (
        "gateway_account.condominium.already_registered_remotely",
        "The gateway already has an account for this CNPJ but the credentials are not stored here; handle it manually.",
    )
    GATEWAY_UNAVAILABLE = (
        "gateway_account.gateway.unavailable",
        "The gateway did not answer or is rate limiting; try again later.",
    )
    GATEWAY_REJECTED = (
        "gateway_account.gateway.rejected",
        "The gateway refused the request.",
    )
