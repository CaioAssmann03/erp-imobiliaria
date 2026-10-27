"""PersonQuerySet.totals: what the dashboard's registrations card counts."""

import pytest

from apps.core.models import Company

from ..models import Person
from .base import CNPJ_A, CPF_A, CPF_B, make_individual, make_legal

pytestmark = pytest.mark.django_db


def test_totals_split_people_by_kind_and_active(company: Company) -> None:
    make_individual("Maria", CPF_A, company=company)
    inactive = make_individual("Joao", CPF_B, company=company)
    make_legal("Empresa", CNPJ_A, company=company)
    Person.objects.filter(pk=inactive.pk).update(active=False)

    assert Person.objects.totals() == {"total": 3, "active": 2, "individual": 2, "legal": 1}


def test_totals_of_no_people_is_zero() -> None:
    assert Person.objects.none().totals() == {"total": 0, "active": 0, "individual": 0, "legal": 0}
