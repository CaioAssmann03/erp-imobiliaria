from rest_framework import serializers


class PersonSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    code = serializers.IntegerField()
    name = serializers.CharField()
    document = serializers.CharField(allow_blank=True)


class CondominiumSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    code = serializers.IntegerField()
    name = serializers.CharField()
    cnpj = serializers.CharField()
    city = serializers.CharField(source="address.city", default=None, allow_null=True)
    state = serializers.CharField(source="address.state", default=None, allow_null=True)


class UnitSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    condominium = serializers.UUIDField(source="condominium_id")
    condominium_name = serializers.CharField(source="condominium.name")


class BlockSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    condominium = serializers.UUIDField(source="condominium_id")
    condominium_name = serializers.CharField(source="condominium.name")


class CostCenterSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    condominium_name = serializers.CharField(source="condominium.name")


class AccountPayableSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    description = serializers.CharField()
    supplier_name = serializers.CharField(source="supplier.person.name")
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    due_date = serializers.DateField()
    status = serializers.CharField()


class BillingPlanSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    name = serializers.CharField()
    condominium_name = serializers.CharField(source="condominium.name")


class BillingDocumentSearchSerializer(serializers.Serializer[dict[str, object]]):
    id = serializers.UUIDField()
    unit_name = serializers.CharField(source="unit.name")
    condominium_name = serializers.CharField(source="unit.condominium.name")
    payer_name = serializers.CharField(source="payer.name")
    reference_month = serializers.DateField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    status = serializers.CharField()


class SearchSerializer(serializers.Serializer[dict[str, object]]):
    persons = PersonSearchSerializer(many=True)
    condominiums = CondominiumSearchSerializer(many=True)
    units = UnitSearchSerializer(many=True)
    blocks = BlockSearchSerializer(many=True)
    cost_centers = CostCenterSearchSerializer(many=True)
    accounts_payable = AccountPayableSearchSerializer(many=True)
    billing_plans = BillingPlanSearchSerializer(many=True)
    billing_documents = BillingDocumentSearchSerializer(many=True)
