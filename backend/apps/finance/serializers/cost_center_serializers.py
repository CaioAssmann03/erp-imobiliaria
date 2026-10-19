from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import CostCenter


class CostCenterSerializer(ModelRulesMixin, serializers.ModelSerializer[CostCenter]):
    @final
    class Meta:
        model = CostCenter
        fields = ("id", "condominium", "name", "active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
