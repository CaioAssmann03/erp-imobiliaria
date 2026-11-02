from apps.core.infrastructure.errors.base import RuleError


class AssistantQuestionError(RuleError):
    SENSITIVE_DATA = (
        "assistant_question.question.sensitive_data",
        "The question has personal data (an e-mail address or a long number). Remove it and ask again.",
    )
