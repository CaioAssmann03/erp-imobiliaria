from typing import Any, override

from rest_framework import serializers
from typing_extensions import final

from apps.core.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import CurrentAccount


class CurrentAccountSerializer(ModelRulesMixin, serializers.ModelSerializer[CurrentAccount]):
    condominium_name = serializers.CharField(source="condominium.name", read_only=True)

    @final
    class Meta:
        model = CurrentAccount
        fields = ("id", "company", "condominium", "condominium_name", "balance", "created_at", "updated_at")
        # The balance changes only when an entry is posted.
        read_only_fields = ("id", "company", "balance", "created_at", "updated_at")

    @override
    def create(self, validated_data: dict[str, Any]) -> CurrentAccount:
        return CurrentAccount.objects.create(company=request_company(self), **validated_data)


class CostCenterBalanceSerializer(serializers.Serializer[dict[str, Any]]):
    cost_center = serializers.UUIDField()
    cost_center_name = serializers.CharField()
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)


class CurrentAccountBalancesSerializer(serializers.Serializer[dict[str, Any]]):
    """The balance of an account and of each of its cost centers (the statement's *Saldo Sub-Contas*)."""

    balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    cost_centers = CostCenterBalanceSerializer(many=True)
