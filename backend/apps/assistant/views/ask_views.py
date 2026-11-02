from typing import final

from drf_spectacular.utils import extend_schema
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assistant.knowledge import Audience
from apps.assistant.messages import Author, Message
from apps.assistant.serializers import AnswerSerializer, QuestionSerializer
from apps.assistant.services import ask_assistant
from apps.core.infrastructure.api.throttling import TrustedProxyScopedRateThrottle


@final
class AskView(APIView):
    """The ERP assistant: fields and screens, for a logged-in user only (there is no anonymous assistant)."""

    throttle_classes = (TrustedProxyScopedRateThrottle,)
    throttle_scope = "assistant_erp"

    @extend_schema(request=QuestionSerializer, responses=AnswerSerializer, operation_id="assistant_ask_create")
    def post(self, request: Request) -> Response:
        serializer = QuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        history = [Message(Author(item["author"]), item["content"]) for item in serializer.validated_data.get("history", [])]
        answer = ask_assistant(Audience.ERP, serializer.validated_data["question"], history)
        return Response(AnswerSerializer({"answer": answer}).data)
