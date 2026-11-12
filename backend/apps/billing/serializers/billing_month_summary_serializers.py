from typing import Any

from rest_framework import serializers

MAX_SUMMARY_MONTHS = 12
DEFAULT_SUMMARY_MONTHS = 6


class BillingMonthSummaryQuerySerializer(serializers.Serializer[Any]):
    months = serializers.IntegerField(min_value=1, max_value=MAX_SUMMARY_MONTHS, default=DEFAULT_SUMMARY_MONTHS, required=False)


class BillingMonthSummarySerializer(serializers.Serializer[Any]):
    """One reference month: the boletos issued (paid + open) and what was paid and what is still open, count and amount."""

    reference_month = serializers.DateField()
    issued_count = serializers.IntegerField()
    issued_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    paid_count = serializers.IntegerField()
    paid_total = serializers.DecimalField(max_digits=14, decimal_places=2)
    open_count = serializers.IntegerField()
    open_total = serializers.DecimalField(max_digits=14, decimal_places=2)
