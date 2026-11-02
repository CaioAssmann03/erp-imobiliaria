from typing import Any

from rest_framework import serializers


class IssuanceCoverageQuerySerializer(serializers.Serializer[Any]):
    reference_month = serializers.DateField()
    page = serializers.IntegerField(min_value=1, default=1)
    limit = serializers.IntegerField(min_value=1, max_value=100, default=10)


class IssuanceCoverageCondominiumSerializer(serializers.Serializer[Any]):
    id = serializers.UUIDField()
    code = serializers.IntegerField()
    name = serializers.CharField()


class IssuanceCoverageSerializer(serializers.Serializer[Any]):
    """The active condominiums, how many have a boleto issued in the month and which do not."""

    expected = serializers.IntegerField()
    issued = serializers.IntegerField()
    missing_count = serializers.IntegerField(help_text="How many condominiums have no boleto; `missing` is one page of them (`?page=`, `?limit=`).")
    missing = IssuanceCoverageCondominiumSerializer(many=True)
