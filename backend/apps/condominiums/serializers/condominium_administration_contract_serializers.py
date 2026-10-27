from typing import final

from rest_framework import serializers

from apps.core.serializers import ModelRulesMixin

from ..models import CondominiumAdministrationContract


class CondominiumAdministrationContractSerializer(
    ModelRulesMixin, serializers.ModelSerializer[CondominiumAdministrationContract]
):
    @final
    class Meta:
        model = CondominiumAdministrationContract
        exclude = ("condominium",)
        read_only_fields = ("id",)
