from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import CondominiumBillingRules


class CondominiumBillingRulesSerializer(ModelRulesMixin, serializers.ModelSerializer[CondominiumBillingRules]):
    @final
    class Meta:
        model = CondominiumBillingRules
        fields = "__all__"
        read_only_fields = ("id",)
