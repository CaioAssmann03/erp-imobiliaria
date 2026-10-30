"""Spec 061: what has a code is listed by the code, never by the name of the entity that owns it."""

import re

import pytest
from django.apps import apps

from apps.billing.models import BillingEvent
from apps.condominiums.models import Condominium
from apps.finance.models import CostCenter, CostCenterCatalogItem
from apps.persons.models import Person


@pytest.mark.parametrize(
    ("model", "ordering"),
    [
        (Condominium, ("code",)),
        (Person, ("code",)),
        (BillingEvent, ("code",)),
        (CostCenterCatalogItem, ("code",)),
        (CostCenter, ("condominium__code", "code")),
    ],
)
def test_the_models_with_a_code_are_ordered_by_it(model: type, ordering: tuple[str, ...]) -> None:
    assert model._meta.ordering == ordering  # type: ignore[attr-defined]


def test_no_model_is_ordered_by_the_name_of_a_condominium_or_a_person() -> None:
    """A model that belongs to a condominium or a person follows their code (`condominium__code`, `person__code`)."""
    offenders = [
        f"{model.__name__}: {key}"
        for model in apps.get_models()
        for key in model._meta.ordering
        if re.search(r"(condominium|person)__name$", str(key).lstrip("-"))
    ]

    assert offenders == []
