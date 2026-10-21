"""BillingRun: reference month and times (spec 026, R8)."""

from datetime import date, timedelta

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.condominiums.models import Condominium

from ..models import BillingRun

pytestmark = pytest.mark.django_db


def test_reference_month_is_written_as_its_first_day(condominium: Condominium) -> None:
    run = BillingRun(condominium=condominium, reference_month=date(2026, 10, 15))

    with pytest.raises(ValidationError) as raised:
        run.full_clean()

    assert [error.code for error in raised.value.error_dict["reference_month"]] == ["month.not_first_day"]


def test_a_run_cannot_finish_before_it_starts(condominium: Condominium) -> None:
    started = timezone.now()
    run = BillingRun(condominium=condominium, reference_month=date(2026, 10, 1), started_at=started, finished_at=started - timedelta(seconds=1))

    with pytest.raises(ValidationError) as raised:
        run.full_clean()
    with pytest.raises(IntegrityError), transaction.atomic():
        run.save()

    assert [error.code for error in raised.value.error_dict["finished_at"]] == ["billing_run.finished_at.before_started_at"]
