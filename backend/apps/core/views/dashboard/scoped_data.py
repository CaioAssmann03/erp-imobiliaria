from dataclasses import dataclass
from typing import Any, cast

from django.db import models

from apps.condominiums.models import (
    AdministrationContract,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.core.scoping import scope_to_company
from apps.finance.models import AccountPayable
from apps.finance.models.querysets import AccountPayableQuerySet
from apps.persons.models import Person


@dataclass(frozen=True)
class ScopedData:
    """The records the dashboard reads, already limited to the user's company (spec 004)."""

    condominiums: models.QuerySet[Condominium]
    units: models.QuerySet[Unit]
    persons: models.QuerySet[Person]
    contracts: models.QuerySet[AdministrationContract]
    unit_people: models.QuerySet[UnitPerson]
    accounts_payable: AccountPayableQuerySet

    @classmethod
    def for_user(cls, user: Any) -> "ScopedData":
        return cls(
            condominiums=scope_to_company(Condominium.objects.all(), user),
            units=scope_to_company(Unit.objects.all(), user),
            persons=scope_to_company(Person.objects.all(), user),
            contracts=scope_to_company(AdministrationContract.objects.all(), user),
            unit_people=scope_to_company(UnitPerson.objects.all(), user),
            accounts_payable=cast(
                AccountPayableQuerySet, scope_to_company(AccountPayable.objects.all(), user)
            ),
        )
