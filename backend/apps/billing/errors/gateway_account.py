from apps.core.errors.base import RuleError


class GatewayAccountError(RuleError):
    API_KEY_INVALID = (
        "gateway_account.api_key.invalid",
        "The gateway did not accept this API key.",
    )
    WEBHOOK_URL_MISSING = (
        "gateway_account.webhook_url.missing",
        "ASAAS_WEBHOOK_URL is not set, so there is no address to register at the gateway.",
    )
    GATEWAY_UNAVAILABLE = (
        "gateway_account.gateway.unavailable",
        "The gateway did not answer or is rate limiting; try again later.",
    )
    GATEWAY_REJECTED = (
        "gateway_account.gateway.rejected",
        "The gateway refused the request.",
    )
