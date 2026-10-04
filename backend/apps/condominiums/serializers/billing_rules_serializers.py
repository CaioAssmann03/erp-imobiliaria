from decimal import Decimal

from rest_framework import serializers
from typing_extensions import final

from ..models import BillingRules


class BillingRulesSerializer(serializers.ModelSerializer[BillingRules]):
    @final
    class Meta:
        model = BillingRules
        exclude = ("condominium",)
        read_only_fields = ("id",)

    def validate_due_day(self, value: int) -> int:
        if not 1 <= value <= 28:
            raise serializers.ValidationError("Due day must be between 1 and 28")
        return value

    def validate_early_payment_discount_percentage(self, value: Decimal) -> Decimal:
        if not 0 <= value <= 100:
            raise serializers.ValidationError("Discount must be between 0 and 100")
        return value
