from typing import Any, override

from django.db import transaction
from rest_framework import serializers
from typing_extensions import final

from apps.core.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import Address, AdministrationContract, BillingRules, Condominium
from .address_serializers import AddressSerializer
from .administration_contract_serializers import AdministrationContractSerializer
from .billing_rules_serializers import BillingRulesSerializer


@final
class CondominiumSerializer(ModelRulesMixin, serializers.ModelSerializer[Condominium]):
    address = AddressSerializer(required=False, allow_null=True)
    administration_contract = AdministrationContractSerializer(required=False)
    billing_rules = BillingRulesSerializer(required=False)

    @final
    class Meta:
        model = Condominium
        fields = (
            "id",
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
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "company", "created_at", "updated_at")

    @override
    @transaction.atomic
    def create(self, validated_data: dict[str, Any]) -> Condominium:
        address_data = validated_data.pop("address", None)
        contract_data = validated_data.pop("administration_contract", None)
        rules_data = validated_data.pop("billing_rules", None)

        if address_data:
            validated_data["address"] = Address.objects.create(**address_data)

        condominium = Condominium.objects.create(company=request_company(self), **validated_data)

        if contract_data:
            _ = AdministrationContract.objects.create(
                condominium=condominium, **contract_data
            )
        if rules_data:
            _ = BillingRules.objects.create(condominium=condominium, **rules_data)

        return condominium

    @staticmethod
    def _save_address(condominium: Condominium, address_data: dict[str, Any]) -> None:
        """Create the address, or update the existing one in place (never replace it)."""
        if condominium.address is None:
            condominium.address = Address.objects.create(**address_data)
            return
        for field_name, field_value in address_data.items():
            setattr(condominium.address, field_name, field_value)
        condominium.address.save()

    @override
    @transaction.atomic
    def update(
        self, instance: Condominium, validated_data: dict[str, Any]
    ) -> Condominium:
        address_data = validated_data.pop("address", None)
        contract_data = validated_data.pop("administration_contract", None)
        rules_data = validated_data.pop("billing_rules", None)

        if address_data:
            self._save_address(instance, address_data)

        for field_name, field_value in validated_data.items():
            setattr(instance, field_name, field_value)
        instance.save()

        if contract_data:
            _ = AdministrationContract.objects.update_or_create(
                condominium=instance, defaults=contract_data
            )
        if rules_data:
            _ = BillingRules.objects.update_or_create(
                condominium=instance, defaults=rules_data
            )

        return instance
