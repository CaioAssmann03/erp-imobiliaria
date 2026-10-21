import json
from typing import Any

import urllib3
from django.conf import settings

from apps.billing.errors import GatewayAccountError

REQUEST_TIMEOUT_SECONDS = 15.0
RATE_LIMITED_STATUS = 429


class GatewayError(Exception):
    """A gateway call failed. Carries a stable code; the message never holds a credential."""

    def __init__(self, error: GatewayAccountError, detail: str = "") -> None:
        super().__init__(f"{error.message} {detail}".strip())
        self.error = error


class AsaasClient:
    """Thin client of the Asaas API v3. `api_key` is the parent key unless a sub-account's is given."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None) -> None:
        self._api_key = settings.ASAAS_API_KEY if api_key is None else api_key
        self._base_url = (base_url or settings.ASAAS_BASE_URL).rstrip("/")
        self._pool = urllib3.PoolManager()

    def find_accounts_by_document(self, cpf_cnpj: str) -> list[dict[str, Any]]:
        body = self._request("GET", "/accounts", query={"cpfCnpj": cpf_cnpj})
        data = body.get("data", [])
        return data if isinstance(data, list) else []

    def create_account(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/accounts", payload=payload)

    def get_account_status(self) -> dict[str, Any]:
        return self._request("GET", "/myAccount/status")

    def _request(
        self, method: str, path: str, payload: dict[str, Any] | None = None, query: dict[str, str] | None = None
    ) -> dict[str, Any]:
        try:
            response = self._pool.request(
                method,
                f"{self._base_url}{path}",
                fields=query,
                body=json.dumps(payload).encode() if payload is not None else None,
                headers={"access_token": self._api_key, "Content-Type": "application/json"},
                timeout=REQUEST_TIMEOUT_SECONDS,
                retries=False,
            )
        except urllib3.exceptions.HTTPError as error:
            raise GatewayError(GatewayAccountError.GATEWAY_UNAVAILABLE, type(error).__name__) from None
        if response.status == RATE_LIMITED_STATUS or response.status >= 500:
            raise GatewayError(GatewayAccountError.GATEWAY_UNAVAILABLE, f"HTTP {response.status}")
        try:
            body = json.loads(response.data or b"{}")
        except ValueError:
            raise GatewayError(GatewayAccountError.GATEWAY_UNAVAILABLE, "invalid response") from None
        if response.status >= 400:
            raise GatewayError(GatewayAccountError.GATEWAY_REJECTED, f"HTTP {response.status} {_error_codes(body)}")
        return body if isinstance(body, dict) else {}


def _error_codes(body: Any) -> str:
    errors = body.get("errors", []) if isinstance(body, dict) else []
    return ",".join(str(error.get("code", "")) for error in errors if isinstance(error, dict))
