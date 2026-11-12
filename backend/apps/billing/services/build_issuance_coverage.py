from dataclasses import dataclass
from datetime import date
from typing import final

from django.db.models import Q, QuerySet

from apps.condominiums.models import Condominium

from ..models import BillingRun


@final
@dataclass(frozen=True)
class IssuanceCoverage:
    expected: int
    issued: int
    missing: QuerySet[Condominium]


def build_issuance_coverage(
    runs: QuerySet[BillingRun], condominiums: QuerySet[Condominium], reference_month: date
) -> IssuanceCoverage:
    """How many of the `condominiums` already have a boleto issued for `reference_month`, and which do not.

    A condominium is covered when a run of the month issued something or found everything already issued. Both
    querysets are already limited to what the user may see.
    """
    covered = (
        runs.filter(reference_month=reference_month)
        .filter(Q(issued_count__gt=0) | Q(already_issued_count__gt=0))
        .values("condominium_id")
    )
    missing = condominiums.exclude(pk__in=covered)
    expected = condominiums.count()
    return IssuanceCoverage(expected=expected, issued=expected - missing.count(), missing=missing)
