from rest_framework import serializers


class CondominiumFeeSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class FixedRevenueSerializer(serializers.Serializer[dict[str, object]]):
    monthly_total = serializers.DecimalField(max_digits=12, decimal_places=2)
    fixed_condominiums = serializers.IntegerField()
    variable_condominiums = serializers.IntegerField(
        help_text="Taxa em %: dependem do financeiro"
    )
    largest = CondominiumFeeSerializer(many=True)
