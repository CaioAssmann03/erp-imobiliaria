from rest_framework import serializers


class ResponsiblesSerializer(serializers.Serializer[dict[str, object]]):
    active_units = serializers.IntegerField()
    with_responsible = serializers.IntegerField(
        help_text="Unidades ativas com proprietário/locatário vigente"
    )
