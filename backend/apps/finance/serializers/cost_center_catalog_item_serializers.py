from typing import Any, final, override

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.core.infrastructure.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import CostCenterCatalogItem


class CostCenterCatalogItemSerializer(ModelRulesMixin, serializers.ModelSerializer[CostCenterCatalogItem]):
    """A sub-conta of the administradora's catalog; `cost_center_count` is how many condominiums use it."""

    cost_center_count = serializers.SerializerMethodField()

    @final
    class Meta:
        model = CostCenterCatalogItem
        fields = ("id", "company", "code", "name", "active", "cost_center_count", "created_at", "updated_at")
        read_only_fields = ("id", "company", "created_at", "updated_at")
        extra_kwargs = {"code": {"required": False}}
        # DRF would require `code` for its own unique-together check; the model constraints run in `ModelRulesMixin`.
        validators = ()

    @extend_schema_field(serializers.IntegerField())
    def get_cost_center_count(self, item: CostCenterCatalogItem) -> int:
        """The list annotates the count; a record just created or updated is counted here."""
        annotated: int | None = getattr(item, "cost_center_count", None)
        return annotated if annotated is not None else item.cost_centers.count()

    @override
    def create(self, validated_data: dict[str, Any]) -> CostCenterCatalogItem:
        return CostCenterCatalogItem.objects.create(company=request_company(self), **validated_data)
