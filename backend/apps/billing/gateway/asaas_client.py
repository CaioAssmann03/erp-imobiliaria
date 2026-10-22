import json
from datetime import date
from typing import Any

import urllib3
from django.conf import settings

from apps.billing.errors import GatewayAccountError
from apps.core.errors.base import RuleError

REQUEST_TIMEOUT_SECONDS = 15.0
RATE_LIMITED_STATUS = 429
PAGE_SIZE = 100


class GatewayError(Exception):
    """A gateway call or its preconditions failed. Carries a stable code and the gateway's own codes; the message never holds a credential."""

    def __init__(self, error: RuleError, detail: str = "", codes: tuple[str, ...] = ()) -> None:
        super().__init__(f"{error.message} {detail}".strip())
        self.error = error
        self.codes = codes


class GatewayUnavailable(GatewayError):
    """The gateway did not answer, rate limited or failed (5xx): worth retrying later."""

    def __init__(self, detail: str = "") -> None:
        super().__init__(GatewayAccountError.GATEWAY_UNAVAILABLE, detail)


class AsaasClient:
    """Thin client of the Asaas API v3. `api_key` is the parent key unless a sub-account's is given."""

    def __init__(self, api_key: str | None = None, base_url: str | None = None) -> None:
        self._api_key = settings.ASAAS_API_KEY if api_key is None else api_key
        self._base_url = (base_url or settings.ASAAS_BASE_URL).rstrip("/")
        self._pool = urllib3.PoolManager()

    def find_accounts_by_document(self, cpf_cnpj: str) -> list[dict[str, Any]]:
        return _data(self._request("GET", "/accounts", query={"cpfCnpj": cpf_cnpj}))

    def create_account(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/accounts", payload=payload)

    def get_account_status(self) -> dict[str, Any]:
        return self._request("GET", "/myAccount/status")

    def find_customers(self, query: dict[str, str]) -> list[dict[str, Any]]:
        """Customers matching `externalReference` or `cpfCnpj` (the API allows duplicates)."""
        return _data(self._request("GET", "/customers", query=query))

    def create_customer(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/customers", payload=payload)

    def find_payments_by_external_reference(self, external_reference: str) -> list[dict[str, Any]]:
        return _data(self._request("GET", "/payments", query={"externalReference": external_reference}))

    def create_payment(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._request("POST", "/payments", payload=payload)

    def list_received_payments(self, received_from: date, received_to: date) -> list[dict[str, Any]]:
        """Every payment received between the two dates (the gateway pages by 100; all pages are read)."""
        payments: list[dict[str, Any]] = []
        offset = 0
        while True:
            body = self._request(
                "GET",
                "/payments",
                query={
                    "status": "RECEIVED",
                    "paymentDate[ge]": received_from.isoformat(),
                    "paymentDate[le]": received_to.isoformat(),
                    "limit": str(PAGE_SIZE),
                    "offset": str(offset),
                },
            )
            payments.extend(_data(body))
            if not body.get("hasMore"):
                return payments
            offset += PAGE_SIZE

    def delete_payment(self, payment_id: str) -> dict[str, Any]:
        """Cancel a charge at the gateway so it cannot be paid (a paid one is refused)."""
        return self._request("DELETE", f"/payments/{payment_id}")

    def get_identification_field(self, payment_id: str) -> dict[str, Any]:
        """Digitable line (`identificationField`), `nossoNumero` and `barCode` of a boleto charge."""
        return self._request("GET", f"/payments/{payment_id}/identificationField")

    def get_pix_qr_code(self, payment_id: str) -> dict[str, Any]:
        """`encodedImage`, `payload` and `expirationDate` of the Pix QR code of a charge."""
        return self._request("GET", f"/payments/{payment_id}/pixQrCode")

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
            raise GatewayUnavailable(type(error).__name__) from None
        if response.status == RATE_LIMITED_STATUS or response.status >= 500:
            raise GatewayUnavailable(f"HTTP {response.status}")
        try:
            body = json.loads(response.data or b"{}")
        except ValueError:
            raise GatewayUnavailable("invalid response") from None
        if response.status >= 400:
            codes = _error_codes(body)
            raise GatewayError(GatewayAccountError.GATEWAY_REJECTED, f"HTTP {response.status} {','.join(codes)}", codes)
        return body if isinstance(body, dict) else {}


def _data(body: dict[str, Any]) -> list[dict[str, Any]]:
    data = body.get("data", [])
    return data if isinstance(data, list) else []


def _error_codes(body: Any) -> tuple[str, ...]:
    errors = body.get("errors", []) if isinstance(body, dict) else []
    return tuple(str(error.get("code", "")) for error in errors if isinstance(error, dict))
