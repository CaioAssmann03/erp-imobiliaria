from typing import Any, override

from rest_framework import serializers
from typing_extensions import final

from apps.core.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import EntryBatch


class EntryBatchSerializer(ModelRulesMixin, serializers.ModelSerializer[EntryBatch]):
    @final
    class Meta:
        model = EntryBatch
        fields = ("id", "company", "batch_date", "origin", "cash_number", "created_at", "updated_at")
        read_only_fields = ("id", "company", "created_at", "updated_at")

    @override
    def create(self, validated_data: dict[str, Any]) -> EntryBatch:
        return EntryBatch.objects.create(company=request_company(self), **validated_data)
