from collections.abc import Sequence
from typing import Any, final

from django.conf import settings

from apps.assistant.messages import Author, Message

from .errors import ProviderError
from .transport import MAXIMUM_OUTPUT_TOKENS, TEMPERATURE, post_json

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


@final
class GeminiClient:
    """Google Gemini through its free API key; the key travels only in a header."""

    name = "gemini"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._api_key = settings.GEMINI_API_KEY if api_key is None else api_key
        self._model = settings.GEMINI_MODEL if model is None else model

    @property
    def is_configured(self) -> bool:
        return bool(self._api_key and self._model)

    def answer(self, instructions: str, messages: Sequence[Message]) -> str:
        payload: dict[str, Any] = {
            "systemInstruction": {"parts": [{"text": instructions}]},
            "contents": [
                {"role": "model" if message.author is Author.ASSISTANT else "user", "parts": [{"text": message.text}]} for message in messages
            ],
            # The answer is short: no thinking tokens, or they would eat the output cap.
            "generationConfig": {
                "maxOutputTokens": MAXIMUM_OUTPUT_TOKENS,
                "temperature": TEMPERATURE,
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        body = post_json(GEMINI_URL.format(model=self._model), {"x-goog-api-key": self._api_key}, payload)
        try:
            text = "".join(str(part.get("text", "")) for part in body["candidates"][0]["content"]["parts"])
        except (KeyError, IndexError, TypeError, AttributeError):
            raise ProviderError("invalid response") from None
        if not text.strip():
            raise ProviderError("empty answer")
        return text.strip()
