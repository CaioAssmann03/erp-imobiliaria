import json
from typing import Any

import urllib3

from .errors import ProviderError

REQUEST_TIMEOUT_SECONDS = 20.0
MAXIMUM_OUTPUT_TOKENS = 400
TEMPERATURE = 0.2

_pool = urllib3.PoolManager()


def post_json(url: str, headers: dict[str, str], payload: dict[str, Any]) -> dict[str, Any]:
    """POST a JSON body and return the JSON object that came back; any failure (network, 4xx, 5xx, bad body) is a `ProviderError`."""
    try:
        response = _pool.request(
            "POST",
            url,
            body=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", **headers},
            timeout=REQUEST_TIMEOUT_SECONDS,
            retries=False,
        )
    except urllib3.exceptions.HTTPError as error:
        raise ProviderError(type(error).__name__) from None
    if response.status >= 400:
        raise ProviderError(f"HTTP {response.status}")
    try:
        body = json.loads(response.data or b"{}")
    except ValueError:
        raise ProviderError("invalid response") from None
    if not isinstance(body, dict):
        raise ProviderError("invalid response")
    return body
