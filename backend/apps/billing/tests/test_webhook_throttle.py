"""The public webhooks are rate limited per client address (spec 065, R5)."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.throttling import ScopedRateThrottle

pytestmark = pytest.mark.django_db

WEBHOOKS = (("asaas-webhook", "webhook_asaas", "1000/min"), ("resend-webhook", "webhook_resend", "300/min"))


@pytest.mark.parametrize(("route", "scope", "rate"), WEBHOOKS)
def test_the_configured_limits(route: str, scope: str, rate: str) -> None:
    assert ScopedRateThrottle.THROTTLE_RATES[scope] == rate


@pytest.mark.parametrize(("route", "scope", "rate"), WEBHOOKS)
def test_calls_over_the_limit_get_429(route: str, scope: str, rate: str, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, scope, "2/min")
    client = APIClient()

    statuses = [client.post(reverse(route), {}, format="json").status_code for _ in range(3)]

    assert statuses == [status.HTTP_401_UNAUTHORIZED] * 2 + [status.HTTP_429_TOO_MANY_REQUESTS]
