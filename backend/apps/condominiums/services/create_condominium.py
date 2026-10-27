from typing import Any

from django.db import transaction

from apps.condominiums.models import (
    AdministrationContract,
    Condominium,
)
from apps.core.models import Address, Company


@transaction.atomic
def create_condominium(company: Company, condominium_data: dict[str, Any]) -> Condominium:
    """Create a condominium with its optional nested `address` and `administration_contract`."""
    condominium_fields = dict(condominium_data)
    address_data = condominium_fields.pop("address", None)
    contract_data = condominium_fields.pop("administration_contract", None)

    if address_data:
        condominium_fields["address"] = Address.objects.create(company=company, **address_data)

    condominium = Condominium.objects.create(company=company, **condominium_fields)

    if contract_data:
        _ = AdministrationContract.objects.create(condominium=condominium, **contract_data)

    return condominium
