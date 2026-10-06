from apps.core.models import Company

SEEDED_COMPANY_CNPJ = "03136483000144"  # created by migration core.0002_seed_company


def seeded_company() -> Company:
    """The company the initial migration creates; most tests work inside it."""
    company, _ = Company.objects.get_or_create(
        cnpj=SEEDED_COMPANY_CNPJ,
        defaults={"legal_name": "EVE ADM DE IMOVEIS COND E VENDAS LTDA"},
    )
    return company
