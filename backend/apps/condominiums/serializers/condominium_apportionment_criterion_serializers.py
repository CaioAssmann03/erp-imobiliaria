from typing import Any, final, override

from django.db.models import Max

from apps.core.serializers import ModelRulesMixin
from rest_framework import serializers

from ..models import CondominiumApportionmentCriterion


@final
class CondominiumApportionmentCriterionSerializer(ModelRulesMixin, serializers.ModelSerializer[CondominiumApportionmentCriterion]):
    @final
    class Meta:
        model = CondominiumApportionmentCriterion
        fields = ("id", "condominium", "name", "position", "created_at", "updated_at")
        read_only_fields = ("id", "position", "created_at", "updated_at")

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance is None and "condominium" in attrs:
            last_position = attrs["condominium"].apportionment_criteria.aggregate(last=Max("position"))["last"]
            attrs = {**attrs, "position": (last_position or 0) + 1}
        return super().validate(attrs)
