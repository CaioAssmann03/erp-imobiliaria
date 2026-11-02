from collections.abc import Sequence
from typing import Any

import urllib3

from apps.assistant.messages import Message
from apps.assistant.providers.errors import ProviderError


class FakeResponse:
    def __init__(self, status: int, data: bytes) -> None:
        self.status = status
        self.data = data


class FakePool:
    """Stands in for the urllib3 pool: answers in order and records the calls (url, headers, body)."""

    def __init__(self, *responses: FakeResponse | Exception) -> None:
        self.responses = list(responses)
        self.calls: list[dict[str, Any]] = []

    def request(self, method: str, url: str, body: bytes, headers: dict[str, str], **options: Any) -> FakeResponse:
        self.calls.append({"method": method, "url": url, "body": body, "headers": headers, **options})
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class FakeProvider:
    """A provider that answers with `reply`, or fails when `reply` is an error; it records what it was sent."""

    def __init__(self, name: str, reply: str | ProviderError) -> None:
        self.name = name
        self.reply = reply
        self.is_configured = True
        self.received: list[tuple[str, list[Message]]] = []

    def answer(self, instructions: str, messages: Sequence[Message]) -> str:
        self.received.append((instructions, list(messages)))
        if isinstance(self.reply, ProviderError):
            raise self.reply
        return self.reply


NETWORK_ERROR = urllib3.exceptions.HTTPError("down")
