from apps.core.infrastructure.audit import register_audited

from .models import PeopleIndividual, PeopleLegal, Person, PersonModuleMembership


def register() -> None:
    """Personal fields are logged as changed, with a masked value (LGPD)."""
    register_audited(Person, masked_fields=("email", "home_phone", "business_phone", "cell_number"))
    register_audited(
        PeopleIndividual,
        masked_fields=("cpf", "rg", "birthday", "marital_status", "job"),
    )
    register_audited(PeopleLegal, masked_fields=("cnpj", "ie"))
    register_audited(PersonModuleMembership)
