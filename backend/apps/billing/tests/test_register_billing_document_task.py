"""The registration task retries a gateway outage and not a refusal (spec 031, R8)."""

import pytest

from apps.billing.infrastructure.gateway.asaas_client import GatewayUnavailable
from apps.billing.tasks import register_billing_document_task

pytestmark = pytest.mark.django_db


def test_outage_is_retried_and_rejection_is_not() -> None:
    autoretry = getattr(register_billing_document_task, "autoretry_for")

    assert GatewayUnavailable in autoretry
    from apps.billing.infrastructure.gateway.asaas_client import GatewayError

    assert GatewayError not in autoretry  # a refusal is recorded by the service as a failed registration


def test_the_other_tasks_retry_only_what_is_transient() -> None:
    from django.core.exceptions import ObjectDoesNotExist
    from django.db import OperationalError

    from apps.billing.tasks import generate_billing_document_pdf_task, process_gateway_event_task

    for task in (generate_billing_document_pdf_task, process_gateway_event_task):
        autoretry = getattr(task, "autoretry_for")
        assert OperationalError in autoretry
        assert Exception not in autoretry
        assert ObjectDoesNotExist not in autoretry
