from rest_framework.exceptions import APIException

from .errors import AssistantError


class AssistantUnavailable(APIException):
    """No provider could answer (none configured or all failing). Says nothing about why."""

    status_code = 503
    default_detail = AssistantError.UNAVAILABLE.message
    default_code = AssistantError.UNAVAILABLE.value
