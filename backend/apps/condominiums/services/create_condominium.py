from typing import Any

from django.db import transaction

from apps.condominiums.models import (
    Address,
    AdministrationContract,
    BillingRules,
    Condominium,
)
from apps.core.models import Company


@transaction.atomic
def create_condominium(company: Company, condominium_data: dict[str, Any]) -> Condominium:
    """Create a condominium with its optional nested `address`, `administration_contract` and `billing_rules`."""
    condominium_fields = dict(condominium_data)
    address_data = condominium_fields.pop("address", None)
    contract_data = condominium_fields.pop("administration_contract", None)
    rules_data = condominium_fields.pop("billing_rules", None)

    if address_data:
        condominium_fields["address"] = Address.objects.create(**address_data)

    condominium = Condominium.objects.create(company=company, **condominium_fields)

    if contract_data:
        _ = AdministrationContract.objects.create(condominium=condominium, **contract_data)
    if rules_data:
        _ = BillingRules.objects.create(condominium=condominium, **rules_data)

    return condominium
