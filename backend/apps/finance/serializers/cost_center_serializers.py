from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import CostCenter


class CostCenterSerializer(ModelRulesMixin, serializers.ModelSerializer[CostCenter]):
    @final
    class Meta:
        model = CostCenter
        fields = ("id", "condominium", "catalog_item", "code", "name", "active", "created_at", "updated_at")
        # `code` and `name` are the catalog item's (spec 053): the API only picks the item.
        read_only_fields = ("id", "code", "name", "created_at", "updated_at")
        extra_kwargs = {"catalog_item": {"required": True}}
        # DRF would require the pair for its own unique-together check; the model constraints run in `ModelRulesMixin`.
        validators = ()
