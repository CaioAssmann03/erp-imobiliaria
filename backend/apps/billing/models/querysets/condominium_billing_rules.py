from datetime import date
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Exists, OuterRef

if TYPE_CHECKING:
    from apps.billing.models.condominium_billing_rules import CondominiumBillingRules  # noqa: F401


class CondominiumBillingRulesQuerySet(models.QuerySet["CondominiumBillingRules"]):
    def due_for_issuance(self, today: date, catch_up_days: int) -> "CondominiumBillingRulesQuerySet":
        """The rules of the active condominiums to issue today: their issuance day is today or one of the previous
        `catch_up_days - 1` days, and the month has no run for them yet (the day the worker was down is caught up).

        The issuance day only goes from 1 to 28, so the window never reaches back into the previous month.
        """
        from apps.billing.models.billing_run import BillingRun

        month_already_ran = BillingRun.objects.filter(
            condominium=OuterRef("condominium"), reference_month=today.replace(day=1)
        )
        return self.filter(
            ~Exists(month_already_ran),
            condominium__active=True,
            issuance_day__lte=today.day,
            issuance_day__gt=today.day - catch_up_days,
        )
