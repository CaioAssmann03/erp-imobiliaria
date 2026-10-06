"""Rate limiting that survives a proxy (spec 007).

The browser talks to the Next server, which talks to Django: Django only sees the Next server's
address. The Next server forwards the real client address in `X-Forwarded-For` together with a
shared secret (`X-Internal-Key`); the address is trusted only when the secret matches, so nobody
else can forge it to dodge the limit.
"""

import hmac
import logging
from django.conf import settings
from rest_framework.request import Request
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from typing_extensions import override

logger = logging.getLogger(__name__)


class TrustedProxyScopedRateThrottle(ScopedRateThrottle):
    """`ScopedRateThrottle` keyed by the real client address; it never takes login down with the cache."""

    @override
    def get_ident(self, request: Request) -> str:
        key: str = settings.INTERNAL_API_KEY
        provided = request.META.get("HTTP_X_INTERNAL_KEY", "")
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if key and forwarded and hmac.compare_digest(provided.encode(), key.encode()):
            return str(forwarded.split(",")[0].strip())
        return str(request.META.get("REMOTE_ADDR", ""))

    @override
    def allow_request(self, request: Request, view: APIView) -> bool:
        try:
            return bool(super().allow_request(request, view))
        except Exception:  # noqa: BLE001  (a cache failure must not make login unavailable)
            logger.exception("Rate limit unavailable (cache error); letting the request through.")
            return True
