from apps.core.infrastructure.errors.base import RuleError


class AssistantError(RuleError):
    UNAVAILABLE = ("assistant.unavailable", "The assistant is unavailable. Try again later.")
