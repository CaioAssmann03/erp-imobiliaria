from typing import Any

from django.db import transaction

from apps.condominiums.models import (
    Address,
    AdministrationContract,
    BillingRules,
    Condominium,
)


@transaction.atomic
def update_condominium(condominium: Condominium, condominium_data: dict[str, Any]) -> Condominium:
    """Update a condominium and its optional nested parts; the address is updated in place, never replaced."""
    condominium_fields = dict(condominium_data)
    address_data = condominium_fields.pop("address", None)
    contract_data = condominium_fields.pop("administration_contract", None)
    rules_data = condominium_fields.pop("billing_rules", None)

    if address_data:
        _save_address(condominium, address_data)

    for field_name, field_value in condominium_fields.items():
        setattr(condominium, field_name, field_value)
    condominium.save()

    if contract_data:
        _ = AdministrationContract.objects.update_or_create(condominium=condominium, defaults=contract_data)
    if rules_data:
        _ = BillingRules.objects.update_or_create(condominium=condominium, defaults=rules_data)

    return condominium


def _save_address(condominium: Condominium, address_data: dict[str, Any]) -> None:
    if condominium.address is None:
        condominium.address = Address.objects.create(**address_data)
        return
    for field_name, field_value in address_data.items():
        setattr(condominium.address, field_name, field_value)
    condominium.address.save()
