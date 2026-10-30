from typing import Any

from rest_framework import serializers

from ..services.build_delinquency_report import MAX_PAGE_SIZE, PAGE_SIZE


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


class DelinquencyQuerySerializer(serializers.Serializer[Any]):
    page = serializers.IntegerField(min_value=1, default=1, required=False)
    page_size = serializers.IntegerField(min_value=1, max_value=MAX_PAGE_SIZE, default=PAGE_SIZE, required=False)


class DelinquencyReportSerializer(serializers.Serializer[Any]):
    """The overdue boletos as of a day: totals, the same per condominium, and the rows of one page (10 per page by default on the screen endpoint, `?page_size=` up to 100; the PDF lists up to 2000, `truncated` says if more)."""

    as_of = serializers.DateField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    by_condominium = DelinquencyCondominiumTotalSerializer(many=True)
    rows = DelinquencyRowSerializer(many=True)
    truncated = serializers.BooleanField()
    page = serializers.IntegerField()
    page_size = serializers.IntegerField()
    page_count = serializers.IntegerField()
