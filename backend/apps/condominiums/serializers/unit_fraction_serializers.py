from typing import final

from rest_framework import serializers

from apps.core.infrastructure.scoping import CompanyScopedPrimaryKeyRelatedField

from ..models import ApportionmentCriterion, UnitFraction


@final
class UnitFractionSerializer(serializers.ModelSerializer[UnitFraction]):
    """One fraction inside a unit's payload; the model rules run when the unit's set is saved."""

    criterion = CompanyScopedPrimaryKeyRelatedField(queryset=ApportionmentCriterion.objects.all())

    @final
    class Meta:
        model = UnitFraction
        fields = ("criterion", "value")
