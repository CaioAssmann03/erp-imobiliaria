from typing import Any, final, override

from rest_framework import serializers

from apps.core.infrastructure.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import EntryBatch


class EntryBatchSerializer(ModelRulesMixin, serializers.ModelSerializer[EntryBatch]):
    @final
    class Meta:
        model = EntryBatch
        fields = ("id", "company", "number", "batch_date", "origin", "cash_number", "created_at", "updated_at")
        read_only_fields = ("id", "company", "created_at", "updated_at")
        extra_kwargs = {"number": {"required": False}}
        # DRF would require `number` for its own unique-together check; the model constraints run in `ModelRulesMixin`.
        validators = ()

    @override
    def create(self, validated_data: dict[str, Any]) -> EntryBatch:
        return EntryBatch.objects.create(company=request_company(self), **validated_data)
