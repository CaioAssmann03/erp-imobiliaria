"""The company's own rules, on the model: the Admin is the only place that writes it (spec 067)."""

import pytest
from django.core.exceptions import ValidationError

from apps.core.models import Company

pytestmark = pytest.mark.django_db

CNPJ = "11222333000181"


def test_invalid_cnpj_is_rejected() -> None:
    with pytest.raises(ValidationError) as raised:
        Company(legal_name="ACME", cnpj="11222333000180").full_clean()

    assert "cnpj" in raised.value.message_dict


def test_cnpj_is_unique() -> None:
    _ = Company.objects.create(legal_name="A", cnpj=CNPJ)

    with pytest.raises(ValidationError) as raised:
        Company(legal_name="B", cnpj=CNPJ).full_clean()

    assert "cnpj" in raised.value.message_dict
