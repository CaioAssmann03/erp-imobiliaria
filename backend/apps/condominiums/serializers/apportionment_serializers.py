from typing import Any

from rest_framework import serializers


class ApportionmentFractionSerializer(serializers.Serializer[dict[str, Any]]):
    number = serializers.IntegerField(min_value=1, max_value=6)
    # Room for a sum far above 1 (data written around the rules), so the card never fails on it.
    total = serializers.DecimalField(max_digits=14, decimal_places=8)
    is_inconsistent = serializers.BooleanField()


class ApportionmentSerializer(serializers.Serializer[dict[str, Any]]):
    """The active units of a condominium and the sum of each of the six ideal fractions over them."""

    active_units = serializers.IntegerField()
    fractions = ApportionmentFractionSerializer(many=True)
