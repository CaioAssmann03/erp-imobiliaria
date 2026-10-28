from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import CondominiumBillingRules


class CondominiumBillingRulesSerializer(ModelRulesMixin, serializers.ModelSerializer[CondominiumBillingRules]):
    @final
    class Meta:
        model = CondominiumBillingRules
        fields = (
            "id",
            "due_day",
            "due_on_business_day",
            "issuance_day",
            "exempts_manager_unit",
            "due_month",
            "competence_month",
            "early_payment_discount_percentage",
            "early_payment_discount_days",
            "credit_limit",
            "late_fee_percentage",
            "initial_late_fee_percentage",
            "initial_late_fee_days",
            "interest_calculation",
            "interest_grace_days",
            "should_show_qr_code",
            "should_show_fee_statement",
            "condominium",
        )
        read_only_fields = ("id",)
