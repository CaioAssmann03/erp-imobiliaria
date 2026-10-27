from typing import Any

from rest_framework import serializers


class CondominiumApportionmentCriterionTotalSerializer(serializers.Serializer[dict[str, Any]]):
    criterion = serializers.UUIDField()
    name = serializers.CharField()
    position = serializers.IntegerField(min_value=1)
    # Room for a sum far above 1 (data written around the rules), so the card never fails on it.
    total = serializers.DecimalField(max_digits=14, decimal_places=8)
    is_inconsistent = serializers.BooleanField()


class ApportionmentSerializer(serializers.Serializer[dict[str, Any]]):
    """The active units of a condominium and the sum of each apportionment criterion's fractions over them."""

    active_units = serializers.IntegerField()
    criteria = CondominiumApportionmentCriterionTotalSerializer(many=True)
