from dataclasses import dataclass
from typing import Any, cast

from apps.condominiums.models import (
    AdministrationContract,
    Condominium,
    Unit,
    UnitPerson,
)
from apps.condominiums.models.querysets import (
    AdministrationContractQuerySet,
    CondominiumQuerySet,
    UnitPersonQuerySet,
    UnitQuerySet,
)
from apps.core.infrastructure.scoping import scope_to_company
from apps.finance.models import AccountPayable
from apps.finance.models.querysets import AccountPayableQuerySet
from apps.persons.models import Person
from apps.persons.models.querysets import PersonQuerySet


@dataclass(frozen=True)
class ScopedData:
    """The records the dashboard reads, already limited to the user's company (spec 004)."""

    condominiums: CondominiumQuerySet
    units: UnitQuerySet
    persons: PersonQuerySet
    contracts: AdministrationContractQuerySet
    unit_people: UnitPersonQuerySet
    accounts_payable: AccountPayableQuerySet

    @classmethod
    def for_user(cls, user: Any) -> "ScopedData":
        return cls(
            condominiums=cast(
                CondominiumQuerySet, scope_to_company(Condominium.objects.all(), user)
            ),
            units=cast(UnitQuerySet, scope_to_company(Unit.objects.all(), user)),
            persons=cast(PersonQuerySet, scope_to_company(Person.objects.all(), user)),
            contracts=cast(
                AdministrationContractQuerySet,
                scope_to_company(AdministrationContract.objects.all(), user),
            ),
            unit_people=cast(
                UnitPersonQuerySet, scope_to_company(UnitPerson.objects.all(), user)
            ),
            accounts_payable=cast(
                AccountPayableQuerySet, scope_to_company(AccountPayable.objects.all(), user)
            ),
        )
