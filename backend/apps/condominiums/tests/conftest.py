import pytest

from apps.core.models import Company

from ..models import Condominium

VALID_CNPJ = "11222333000181"


@pytest.fixture
def company() -> Company:
    return Company.objects.create(legal_name="Administradora", cnpj="00000000000191")


@pytest.fixture
def condominium(company: Company) -> Condominium:
    return Condominium.objects.create(
        company=company, name="Residencial Sol", cnpj=VALID_CNPJ
    )
