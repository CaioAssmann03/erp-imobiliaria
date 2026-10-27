import json
from typing import Any

import urllib3
from django.conf import settings

RESEND_URL = "https://api.resend.com/emails"
REQUEST_TIMEOUT_SECONDS = 15.0
RATE_LIMITED_STATUS = 429
SERVER_ERROR_STATUS = 500


class EmailNotConfigured(Exception):
    """No API key or sender is set: nothing can be sent."""


class EmailUnavailable(Exception):
    """The provider did not answer, rate limited or failed (5xx): worth retrying later."""


class EmailRejected(Exception):
    """The provider refused the message (4xx): retrying will not help."""


class ResendClient:
    """Thin client of the Resend API; the key never appears in a message."""

    def __init__(self, api_key: str | None = None, sender: str | None = None) -> None:
        self._api_key = settings.RESEND_API_KEY if api_key is None else api_key
        self._sender = settings.RESEND_FROM if sender is None else sender
        self._pool = urllib3.PoolManager()

    def send(self, to: str, subject: str, html: str, text: str, idempotency_key: str) -> str:
        """Send one e-mail and return the provider's message id; the idempotency key makes a retry harmless."""
        if not self._api_key or not self._sender:
            raise EmailNotConfigured
        try:
            response = self._pool.request(
                "POST",
                RESEND_URL,
                body=json.dumps({"from": self._sender, "to": [to], "subject": subject, "html": html, "text": text}).encode(),
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                    "Idempotency-Key": idempotency_key,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
                retries=False,
            )
        except urllib3.exceptions.HTTPError as error:
            raise EmailUnavailable(type(error).__name__) from None
        if response.status == RATE_LIMITED_STATUS or response.status >= SERVER_ERROR_STATUS:
            raise EmailUnavailable(f"HTTP {response.status}")
        try:
            body: Any = json.loads(response.data or b"{}")
        except ValueError:
            raise EmailUnavailable("invalid response") from None
        if response.status >= 400 or not isinstance(body, dict) or not body.get("id"):
            raise EmailRejected(f"HTTP {response.status}")
        return str(body["id"])
