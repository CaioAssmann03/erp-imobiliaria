from typing import Any, final, override

from rest_framework import serializers

from apps.core.infrastructure.scoping import request_company
from apps.core.serializers import AddressSerializer, ModelRulesMixin

from ..models import Condominium
from ..services.create_condominium import create_condominium
from ..services.update_condominium import update_condominium
from .administration_contract_serializers import AdministrationContractSerializer


@final
class CondominiumSerializer(ModelRulesMixin, serializers.ModelSerializer[Condominium]):
    address = AddressSerializer(required=False, allow_null=True)
    administration_contract = AdministrationContractSerializer(required=False)

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
            "type",
            "name",
            "cnpj",
            "municipal_registration",
            "water_meter",
            "electricity_meter",
            "gas_meter",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "code", "company", "created_at", "updated_at")

    @override
    def create(self, validated_data: dict[str, Any]) -> Condominium:
        return create_condominium(request_company(self), validated_data)

    @override
    def update(self, instance: Condominium, validated_data: dict[str, Any]) -> Condominium:
        return update_condominium(instance, validated_data)
