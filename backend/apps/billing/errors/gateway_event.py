from apps.core.infrastructure.errors.base import RuleError


class GatewayEventError(RuleError):
    EVENT_ID_DUPLICATE = (
        "gateway_event.event_id.duplicate",
        "The gateway event was already received.",
    )
