from typing import Any, final, override

from rest_framework import serializers

from apps.core.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import Condominium
from ..services.create_condominium import create_condominium
from ..services.update_condominium import update_condominium
from .address_serializers import AddressSerializer
from .administration_contract_serializers import AdministrationContractSerializer
from .billing_rules_serializers import BillingRulesSerializer


@final
class CondominiumSerializer(ModelRulesMixin, serializers.ModelSerializer[Condominium]):
    address = AddressSerializer(required=False, allow_null=True)
    administration_contract = AdministrationContractSerializer(required=False)
    billing_rules = BillingRulesSerializer(required=False)
    unit_count = serializers.SerializerMethodField()

    @final
    class Meta:
        model = Condominium
        fields = (
            "id",
            "code",
            "company",
            "advisor",
            "address",
            "administration_contract",
            "billing_rules",
            "type",
            "name",
            "cnpj",
            "municipal_registration",
            "water_meter",
            "electricity_meter",
            "gas_meter",
            "active",
            "unit_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "code", "company", "created_at", "updated_at")

    def get_unit_count(self, condominium: Condominium) -> int:
        """The units of the condominium: the list annotates it (no query per row), a saved instance counts them."""
        annotated: int | None = getattr(condominium, "unit_count", None)
        return annotated if annotated is not None else condominium.units.count()

    @override
    def create(self, validated_data: dict[str, Any]) -> Condominium:
        return create_condominium(request_company(self), validated_data)

    @override
    def update(self, instance: Condominium, validated_data: dict[str, Any]) -> Condominium:
        return update_condominium(instance, validated_data)
