from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import BillingRules


class BillingRulesSerializer(ModelRulesMixin, serializers.ModelSerializer[BillingRules]):
    @final
    class Meta:
        model = BillingRules
        exclude = ("condominium",)
        read_only_fields = ("id",)
