from collections.abc import Sequence
from typing import Any, final

from django.conf import settings

from apps.assistant.messages import Message

from .errors import ProviderError
from .transport import MAXIMUM_OUTPUT_TOKENS, TEMPERATURE, post_json

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# The gpt-oss models "think" before answering and those tokens count against the output cap (measured: up to 233 of 400),
# which can cut the answer short. Only these models take the parameter; others would answer 400.
LOW_REASONING_MODEL_PREFIX = "openai/gpt-oss"


@final
class GroqClient:
    """Groq's OpenAI-compatible API with its free key; the key travels only in a header."""

    name = "groq"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._api_key = settings.GROQ_API_KEY if api_key is None else api_key
        self._model = settings.GROQ_MODEL if model is None else model

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._model)

    def answer(self, instructions: str, messages: Sequence[Message]) -> str:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": [{"role": "system", "content": instructions}]
            + [{"role": message.author.value, "content": message.text} for message in messages],
            "max_tokens": MAXIMUM_OUTPUT_TOKENS,
            "temperature": TEMPERATURE,
        }
        if self._model.startswith(LOW_REASONING_MODEL_PREFIX):
            payload["reasoning_effort"] = "low"
        body = post_json(GROQ_URL, {"Authorization": f"Bearer {self._api_key}"}, payload)
        try:
            text = str(body["choices"][0]["message"]["content"] or "")
        except (KeyError, IndexError, TypeError):
            raise ProviderError("invalid response") from None
        if not text.strip():
            raise ProviderError("empty answer")
        return text.strip()
