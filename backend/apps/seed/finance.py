"""Demo finance: suppliers, entry templates and open accounts payable."""

from datetime import timedelta
from decimal import Decimal

from django.db import models
from django.db.models import Q

from apps.condominiums.models import (
    Condominium,
)
from apps.finance.models import (
    AccountPayable,
    CostCenter,
    CurrentAccount,
    CurrentAccountEntry,
    EntryBatch,
    EntryTemplate,
    Supplier,
)
from apps.persons.models import PeopleLegal, Person

from .context import SeedContext
from .demo_data import DEMO_CONDOMINIUMS, DEMO_PAYABLES, DEMO_SUPPLIERS, ENTRY_TEMPLATES
from .documents import generate_cnpj
from .fakes import email_slug, random_phone
from .validated import create_validated


def demo_supplier_documents() -> list[str]:
    return [generate_cnpj(100 + position) for position, _ in enumerate(DEMO_SUPPLIERS)]


def create_demo_finance(context: SeedContext) -> None:
    """Suppliers, entry templates and open accounts payable (idempotent; nothing is paid here)."""
    suppliers: dict[str, Supplier] = {}
    for position, name in enumerate(DEMO_SUPPLIERS):
        document = generate_cnpj(100 + position)
        person = Person.objects.filter(people_legal__cnpj=document).first()
        if person is None:
            person = create_validated(
                Person,
                company=context.company,
                name=name,
                email=f"contato@{email_slug(name)}.com.br",
                cell_number=random_phone(context.random_generator),
            )
            _ = create_validated(
                PeopleLegal, person=person, company=context.company, cnpj=document
            )
        suppliers[name] = Supplier.objects.filter(
            person=person
        ).first() or create_validated(Supplier, person=person)

    for demo in DEMO_CONDOMINIUMS:
        condominium = Condominium.objects.filter(name=demo.name).first()
        if condominium is None:
            continue
        for template_cost_center in CostCenter.objects.filter(
            condominium=condominium, name__in=ENTRY_TEMPLATES
        ):
            if not EntryTemplate.objects.filter(cost_center=template_cost_center).exists():
                _ = create_validated(
                    EntryTemplate,
                    cost_center=template_cost_center,
                    name=ENTRY_TEMPLATES[template_cost_center.name],
                )

    for payable in DEMO_PAYABLES:
        supplier = suppliers[payable.supplier]
        condominium = (
            Condominium.objects.filter(
                name=DEMO_CONDOMINIUMS[payable.condominium_position].name
            ).first()
            if payable.condominium_position is not None
            else None
        )
        if payable.condominium_position is not None and condominium is None:
            continue
        already_exists = AccountPayable.objects.filter(
            supplier=supplier, description=payable.description, condominium=condominium
        ).exists()
        if already_exists:
            continue
        cost_center = (
            CostCenter.objects.filter(
                condominium=condominium, name=payable.cost_center
            ).first()
            if condominium is not None
            else None
        )
        if condominium is not None and cost_center is None:
            continue
        _ = create_validated(
            AccountPayable,
            company=context.company,
            condominium=condominium,
            cost_center=cost_center,
            entry_template=EntryTemplate.objects.filter(cost_center=cost_center).first()
            if cost_center
            else None,
            supplier=supplier,
            description=payable.description,
            document_number=f"NF {1000 + context.random_generator.randint(0, 8999)}",
            amount=Decimal(payable.amount),
            issue_date=context.today - timedelta(days=15),
            due_date=context.today + timedelta(days=payable.days_until_due),
        )


def clear_demo_finance(condominiums: "models.QuerySet[Condominium]") -> None:
    """Remove the finance records of the demo (entries are deleted by queryset: they are never edited by hand)."""
    supplier_persons = Person.all_objects.filter(
        people_legal__cnpj__in=demo_supplier_documents()
    )
    suppliers = Supplier.all_objects.filter(person__in=supplier_persons)
    accounts = CurrentAccount.objects.filter(condominium__in=condominiums)
    entries = CurrentAccountEntry.objects.filter(current_account__in=accounts)
    batch_ids = list(entries.values_list("batch_id", flat=True).distinct())
    _ = entries.filter(reversal_of__isnull=False).delete()
    _ = entries.delete()
    _ = EntryBatch.objects.filter(pk__in=batch_ids, entries__isnull=True).delete()
    _ = AccountPayable.objects.filter(
        Q(supplier__in=suppliers) | Q(condominium__in=condominiums)
    ).delete()
    _ = accounts.delete()
    _ = EntryTemplate.objects.filter(cost_center__condominium__in=condominiums).delete()
    _ = suppliers.hard_delete()
    _ = supplier_persons.hard_delete()
