from typing import Any, final, override

from rest_framework import serializers

from apps.core.infrastructure.scoping import request_company
from apps.core.serializers import ModelRulesMixin

from ..models import AccountPayable


class AccountPayableSerializer(ModelRulesMixin, serializers.ModelSerializer[AccountPayable]):
    supplier_name = serializers.CharField(source="supplier.person.name", read_only=True)
    condominium_name = serializers.CharField(source="condominium.name", read_only=True, default=None)
    cost_center_name = serializers.CharField(source="cost_center.name", read_only=True, default=None)
    entry_template_name = serializers.CharField(source="entry_template.name", read_only=True, default=None)

    @final
    class Meta:
        model = AccountPayable
        fields = (
            "id",
            "company",
            "condominium",
            "condominium_name",
            "cost_center",
            "cost_center_name",
            "supplier",
            "supplier_name",
            "entry_template",
            "entry_template_name",
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
