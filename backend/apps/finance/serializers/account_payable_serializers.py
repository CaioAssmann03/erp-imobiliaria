from typing import Any, override

from rest_framework import serializers
from typing_extensions import final

from apps.core.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import AccountPayable


class AccountPayableSerializer(ModelRulesMixin, serializers.ModelSerializer[AccountPayable]):
    supplier_name = serializers.CharField(source="supplier.person.name", read_only=True)

    @final
    class Meta:
        model = AccountPayable
        fields = (
            "id",
            "company",
            "condominium",
            "cost_center",
            "supplier",
            "supplier_name",
            "description",
            "document_number",
            "amount",
            "issue_date",
            "due_date",
            "status",
            "payment_date",
            "amount_paid",
            "payment_method",
            "created_at",
            "updated_at",
        )
        # The life cycle changes only through the `settle` and `cancel` actions.
        read_only_fields = (
            "id",
            "company",
            "status",
            "payment_date",
            "amount_paid",
            "payment_method",
            "created_at",
            "updated_at",
        )

    @override
    def create(self, validated_data: dict[str, Any]) -> AccountPayable:
        return AccountPayable.objects.create(company=request_company(self), **validated_data)


class SettleAccountPayableSerializer(serializers.Serializer[dict[str, Any]]):
    """Payment data to settle an open account."""

    payment_date = serializers.DateField()
    amount_paid = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=AccountPayable.PaymentMethod.choices)
