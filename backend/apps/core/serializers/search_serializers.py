from rest_framework import serializers


class PersonSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    document = serializers.CharField(allow_blank=True)


class CondominiumSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    cnpj = serializers.CharField()
    city = serializers.CharField(source="address.city", default=None, allow_null=True)
    state = serializers.CharField(source="address.state", default=None, allow_null=True)


class UnitSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    condominium = serializers.UUIDField(source="condominium_id")
    condominium_name = serializers.CharField(source="condominium.name")


class SearchSerializer(serializers.Serializer[dict[str, object]]):
    persons = PersonSearchSerializer(many=True)
    condominiums = CondominiumSearchSerializer(many=True)
    units = UnitSearchSerializer(many=True)
