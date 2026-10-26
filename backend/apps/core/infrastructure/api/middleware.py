"""Health probe for the host (spec 008).

A middleware placed first in `MIDDLEWARE`, so the probe is answered before the HTTPS redirect and
before anything that validates the host: a platform probes over plain HTTP with an internal address
(an IP, a service name) as the host. It reveals nothing but up or down.
"""

import logging
from collections.abc import Callable

from django.db import connection
from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger(__name__)

HEALTH_PATH = "/api/health/"


class HealthCheckMiddleware:
    """`GET`/`HEAD` `/api/health/`: 200 if the app runs and the database answers, 503 otherwise."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        if request.path == HEALTH_PATH and request.method in ("GET", "HEAD"):
            return self._answer()
        return self.get_response(request)

    @staticmethod
    def _answer() -> HttpResponse:
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:  
            logger.exception("Health check: the database did not answer.")
            response = JsonResponse({"status": "unavailable"}, status=503)
        else:
            response = JsonResponse({"status": "ok"})
        response["Cache-Control"] = "no-store"
        return response
