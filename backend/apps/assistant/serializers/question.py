from typing import Any

from rest_framework import serializers

from apps.assistant.errors import AssistantQuestionError
from apps.assistant.messages import (
    MAXIMUM_ANSWER_LENGTH,
    MAXIMUM_HISTORY_MESSAGES,
    MAXIMUM_QUESTION_LENGTH,
    Author,
)
from apps.assistant.sensitive_data import find_sensitive_data


class HistoryMessageSerializer(serializers.Serializer[dict[str, str]]):
    author = serializers.ChoiceField(choices=[author.value for author in Author])
    content = serializers.CharField(max_length=MAXIMUM_ANSWER_LENGTH)


class QuestionSerializer(serializers.Serializer[dict[str, Any]]):
    question = serializers.CharField(max_length=MAXIMUM_QUESTION_LENGTH)
    history = serializers.ListField(child=HistoryMessageSerializer(), required=False, max_length=MAXIMUM_HISTORY_MESSAGES)

    def validate_question(self, value: str) -> str:
        if find_sensitive_data(value):
            raise AssistantQuestionError.SENSITIVE_DATA.to_validation_error()
        return value

    def validate_history(self, value: list[dict[str, str]]) -> list[dict[str, str]]:
        """Whole exchanges, oldest first: user, assistant, user, assistant... Only the user's own words are filtered (R14)."""
        if len(value) % 2:
            raise serializers.ValidationError("The history must be whole exchanges.", code="invalid")
        for position, message in enumerate(value):
            expected_author = Author.USER if position % 2 == 0 else Author.ASSISTANT
            if message["author"] != expected_author:
                raise serializers.ValidationError("The history must alternate user and assistant, starting with user.", code="invalid")
            if message["author"] == Author.USER:
                if len(message["content"]) > MAXIMUM_QUESTION_LENGTH:
                    raise serializers.ValidationError("A user message is too long.", code="max_length")
                if find_sensitive_data(message["content"]):
                    raise AssistantQuestionError.SENSITIVE_DATA.to_validation_error()
        return value


class AnswerSerializer(serializers.Serializer[dict[str, str]]):
    answer = serializers.CharField()
