from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import AdministrationContract


class AdministrationContractSerializer(ModelRulesMixin, serializers.ModelSerializer[AdministrationContract]):
    @final
    class Meta:
        model = AdministrationContract
        exclude = ("condominium",)
        read_only_fields = ("id",)
