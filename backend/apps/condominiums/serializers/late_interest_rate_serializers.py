from rest_framework import serializers
from typing_extensions import final

from apps.core.serializers import ModelRulesMixin

from ..models import LateInterestRate


class LateInterestRateSerializer(ModelRulesMixin, serializers.ModelSerializer[LateInterestRate]):
    @final
    class Meta:
        model = LateInterestRate
        fields = ("id", "condominium", "start_date", "monthly_percentage", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
