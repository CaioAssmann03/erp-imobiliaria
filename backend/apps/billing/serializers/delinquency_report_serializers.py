from typing import Any

from rest_framework import serializers


class DelinquencyRowSerializer(serializers.Serializer[Any]):
    document_id = serializers.UUIDField()
    condominium_id = serializers.UUIDField()
    condominium_name = serializers.CharField()
    unit_name = serializers.CharField()
    payer_name = serializers.CharField()
    reference_month = serializers.DateField()
    due_date = serializers.DateField()
    days_overdue = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)


class DelinquencyCondominiumTotalSerializer(serializers.Serializer[Any]):
    condominium_id = serializers.UUIDField()
    condominium_name = serializers.CharField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2)


class DelinquencyReportSerializer(serializers.Serializer[Any]):
    """The overdue boletos as of a day: totals, the same per condominium, and the rows (at most 2000, `truncated` says if more)."""

    as_of = serializers.DateField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_condominium = DelinquencyCondominiumTotalSerializer(many=True)
    rows = DelinquencyRowSerializer(many=True)
    truncated = serializers.BooleanField()
