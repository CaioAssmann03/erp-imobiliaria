from typing import Any, final, override

from rest_framework import serializers

from apps.core.infrastructure.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import BankAccount


class BankAccountSerializer(ModelRulesMixin, serializers.ModelSerializer[BankAccount]):
    @final
    class Meta:
        model = BankAccount
        fields = (
            "id",
            "company",
            "condominium",
            "bank_code",
            "bank_name",
            "branch",
            "account_number",
            "kind",
            "nickname",
            "pix_key",
            "active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "company", "created_at", "updated_at")

    @override
    def create(self, validated_data: dict[str, Any]) -> BankAccount:
        return BankAccount.objects.create(company=request_company(self), **validated_data)
