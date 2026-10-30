from django.db import transaction
from django.utils import timezone

from apps.persons.models import Person

ANONYMIZED_NAME = "Pessoa anonimizada"


@transaction.atomic
def anonymize_person(person: Person) -> Person:
    """The LGPD erasure of a deleted person: personal and bank data become neutral values; the id and every link stay.

    The model refuses it (`validate_anonymizable`) unless the person is deleted, not anonymized yet and past the retention period.
    The documents become a number made of the person's code (never a valid CPF/CNPJ), so they stay unique per company.
    """
    person.validate_anonymizable()

    person.name = ANONYMIZED_NAME
    person.home_phone = None
    person.business_phone = None
    person.cell_number = None
    person.email = ""
    person.active = False
    person.anonymized_at = timezone.now()
    person.save()

    individual = getattr(person, "people_individual", None)
    if individual is not None:
        individual.cpf = f"{person.code:011d}"
        individual.rg = None
        individual.birthday = None
        individual.marital_status = None
        individual.job = None
        individual.save()
    legal = getattr(person, "people_legal", None)
    if legal is not None:
        legal.cnpj = f"{person.code:014d}"
        legal.ie = None
        legal.save()

    supplier = getattr(person, "supplier", None)
    if supplier is not None:
        supplier.bank_code = ""
        supplier.branch = ""
        supplier.account_number = ""
        supplier.account_kind = ""
        supplier.pix_key = ""
        supplier.active = False
        supplier.save()
    return person
