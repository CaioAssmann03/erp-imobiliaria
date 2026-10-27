from typing import final

from rest_framework import serializers

from apps.core.infrastructure.scoping import CompanyScopedPrimaryKeyRelatedField

from ..models import CondominiumApportionmentCriterion, UnitApportionmentFraction


@final
class UnitApportionmentFractionSerializer(serializers.ModelSerializer[UnitApportionmentFraction]):
    """One fraction inside a unit's payload; the model rules run when the unit's set is saved."""

    criterion = CompanyScopedPrimaryKeyRelatedField(queryset=CondominiumApportionmentCriterion.objects.all())

    @final
    class Meta:
        model = UnitApportionmentFraction
        fields = ("criterion", "value")
