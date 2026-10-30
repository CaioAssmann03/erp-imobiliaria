from typing import Any

from rest_framework import serializers


class IssuanceCoverageQuerySerializer(serializers.Serializer[Any]):
    reference_month = serializers.DateField()


class IssuanceCoverageCondominiumSerializer(serializers.Serializer[Any]):
    id = serializers.UUIDField()
    code = serializers.IntegerField()
    name = serializers.CharField()


class IssuanceCoverageSerializer(serializers.Serializer[Any]):
    """The active condominiums, how many have a boleto issued in the month and which do not."""

    expected = serializers.IntegerField()
    issued = serializers.IntegerField()
    missing = IssuanceCoverageCondominiumSerializer(many=True)
