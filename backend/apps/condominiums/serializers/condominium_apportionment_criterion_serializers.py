from typing import Any, final, override

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import CondominiumApportionmentCriterion


@final
class CondominiumApportionmentCriterionSerializer(
    ModelRulesMixin, serializers.ModelSerializer[CondominiumApportionmentCriterion]
):
    @final
    class Meta:
        model = CondominiumApportionmentCriterion
        fields = ("id", "condominium", "name", "position", "created_at", "updated_at")
        read_only_fields = ("id", "position", "created_at", "updated_at")

    @override
    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if self.instance is None and "condominium" in attrs:
            attrs = {
                **attrs,
                "position": CondominiumApportionmentCriterion.next_position_in(
                    attrs["condominium"]
                ),
            }
        return super().validate(attrs)
