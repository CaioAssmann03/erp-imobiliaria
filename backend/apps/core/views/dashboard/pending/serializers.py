from rest_framework import serializers


class PendingItemsSerializer(serializers.Serializer[dict[str, object]]):
    units_without_responsible = serializers.IntegerField(
        help_text="Unidades ativas sem proprietário/locatário: não há a quem cobrar"
    )
    inconsistent_apportionment = serializers.IntegerField(
        help_text="Condomínios ativos cuja soma de alguma fração ideal em uso não fecha 1"
    )
    overdue_adjustments = serializers.IntegerField()
    adjustments_next_30_days = serializers.IntegerField()
    leases_ending = serializers.IntegerField()
    without_cost_centers = serializers.IntegerField(
        help_text="Condomínios ativos sem centros de custo"
    )
    billing_blocked_units = serializers.IntegerField()
