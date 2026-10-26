from typing import Any, final, override

from rest_framework import serializers

from apps.core.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import BillingEvent


class BillingEventSerializer(ModelRulesMixin, serializers.ModelSerializer[BillingEvent]):
    @final
    class Meta:
        model = BillingEvent
        fields = ("id", "company", "code", "name", "active", "created_at", "updated_at")
        read_only_fields = ("id", "company", "created_at", "updated_at")
        # DRF would demand the whole unique-together (it includes the read-only company); the model constraint runs in the mixin.
        validators = ()

    @override
    def create(self, validated_data: dict[str, Any]) -> BillingEvent:
        return BillingEvent.objects.create(company=request_company(self), **validated_data)
